import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as unknown as File | null;
    const providedName = (formData.get('filename') as string) || '';
    const filename = providedName || `recording-${Date.now()}.webm`;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const recordingsDir = path.join(process.cwd(), 'public', 'recordings');
    await fs.mkdir(recordingsDir, { recursive: true });
    const filePath = path.join(recordingsDir, filename);
    await fs.writeFile(filePath, buffer);

    const url = `/recordings/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[recordings] upload failed', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}


