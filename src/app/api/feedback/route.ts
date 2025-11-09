import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const allowedTypes = ['feedback', 'feature', 'bug'] as const;
type FeedbackCategory = (typeof allowedTypes)[number];

const feedbackSchema = z.object({
  type: z
    .string()
    .optional()
    .transform((value) => value?.trim().toLowerCase() ?? 'feedback')
    .refine((value): value is FeedbackCategory => allowedTypes.includes(value as FeedbackCategory), {
      message: `Type must be one of: ${allowedTypes.join(', ')}`,
    }),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(5000, 'Message is too long'),
  email: z
    .string()
    .trim()
    .email('Valid email is required'),
  firstName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  lastName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 10;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-vercel-forwarded-for') ||
    'unknown';

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { success: false, error: 'Too many submissions from this IP. Please try again later.' },
      { status: 429 }
    );
  }

  let payload;

  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((issue) => issue.message);
      return NextResponse.json(
        { success: false, error: 'Invalid feedback submission.', details: errorMessages },
        { status: 400 }
      );
    }

    payload = parsed.data;
  } catch (error) {
    console.error('Feedback parsing error:', error);
    return NextResponse.json(
      { success: false, error: 'Malformed JSON payload.' },
      { status: 400 }
    );
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const backendResponse = await fetch(`${backendUrl}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const backendData = await backendResponse.json().catch(() => ({}));

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            backendData?.message ||
            'Failed to deliver your feedback. Please try again later.',
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: backendData?.message || 'Feedback submitted successfully.',
    });
  } catch (error) {
    console.error('Feedback forwarding error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to reach the feedback service. Please try again shortly.',
      },
      { status: 503 }
    );
  }
}

