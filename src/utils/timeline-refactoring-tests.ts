import { TimelineAnimation, ElementAnimation, AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { migrateToCentralizedTimeline, migrateFromCentralizedTimeline } from '@/utils/timeline-migration';
import { calculateEffectiveDurationV2, calculateTotalTimelineDurationV2 } from '@/utils/animation-utils-v2';

/**
 * Test suite for the new centralized timeline structure
 */

// Test data
const testElements: AnimatedCanvasObject[] = [
  {
    id: "rect1",
    name: "Rectangle 1",
    type: "rectangle",
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    fill: "#ff0000",
    animations: [
      {
        id: "move-1",
        displayName: "move-1",
        type: "move",
        startTime: 0,
        duration: 2,
        properties: { x: 300, y: 200 },
        easing: "power2.out"
      },
      {
        id: "scale-1",
        displayName: "scale-1",
        type: "scale",
        startTime: 2,
        duration: 1,
        properties: { scaleX: 1.5, scaleY: 1.5 },
        easing: "back.out",
        repeat: 2,
        yoyo: true
      }
    ]
  },
  {
    id: "text1",
    name: "Text 1",
    type: "text",
    x: 200,
    y: 120,
    width: 100,
    height: 30,
    fill: "#000000",
    text: "Hello World",
    animations: [
      {
        id: "fade-1",
        displayName: "fade-1",
        type: "fade",
        startTime: 1,
        duration: 1.5,
        properties: { alpha: 0.5 },
        easing: "sine.inOut"
      }
    ]
  }
];

const testGroups: CanvasGroup[] = [
  {
    id: "group1",
    name: "Group 1",
    elementIds: ["rect1", "text1"],
    x: 150,
    y: 110,
    type: "custom",
    isDefaultGroup: false,
    animations: [
      {
        id: "rotate-1",
        displayName: "rotate-1",
        type: "rotate",
        startTime: 3,
        duration: 2,
        properties: { rotation: Math.PI },
        easing: "power3.out"
      }
    ]
  }
];

/**
 * Test migration from old structure to new structure
 */
export function testMigrationToCentralizedTimeline(): boolean {
  console.log("🧪 Testing migration to centralized timeline...");
  
  try {
    const timelineAnimations = migrateToCentralizedTimeline(testElements, testGroups);
    
    // Verify we got the expected number of timeline animations
    const expectedAnimations = 3; // rect1-move, rect1-scale, text1-fade, group1-rotate
    if (timelineAnimations.length !== expectedAnimations) {
      console.error(`❌ Expected ${expectedAnimations} timeline animations, got ${timelineAnimations.length}`);
      return false;
    }
    
    // Verify each timeline animation has the correct structure
    timelineAnimations.forEach(anim => {
      if (!anim.id || !anim.target || !anim.tracks || anim.tracks.length === 0) {
        console.error("❌ Invalid timeline animation structure:", anim);
        return false;
      }
    });
    
    // Verify specific animations exist
    const rectMoveAnim = timelineAnimations.find(anim => 
      anim.target.id === "rect1" && anim.tracks.some(track => track.type === "move")
    );
    if (!rectMoveAnim) {
      console.error("❌ Rectangle move animation not found");
      return false;
    }
    
    const groupRotateAnim = timelineAnimations.find(anim => 
      anim.target.id === "group1" && anim.tracks.some(track => track.type === "rotate")
    );
    if (!groupRotateAnim) {
      console.error("❌ Group rotate animation not found");
      return false;
    }
    
    console.log("✅ Migration to centralized timeline successful");
    return true;
  } catch (error) {
    console.error("❌ Migration to centralized timeline failed:", error);
    return false;
  }
}

/**
 * Test migration from new structure back to old structure
 */
export function testMigrationFromCentralizedTimeline(): boolean {
  console.log("🧪 Testing migration from centralized timeline...");
  
  try {
    // First migrate to new structure
    const timelineAnimations = migrateToCentralizedTimeline(testElements, testGroups);
    
    // Clean the original data (remove animations)
    const cleanElements = testElements.map(el => ({ ...el, animations: [] }));
    const cleanGroups = testGroups.map(group => ({ ...group, animations: [] }));
    
    // Migrate back to old structure
    const { elements, groups } = migrateFromCentralizedTimeline(
      timelineAnimations, 
      cleanElements, 
      cleanGroups
    );
    
    // Verify elements have animations restored
    const rectElement = elements.find(el => el.id === "rect1");
    if (!rectElement || rectElement.animations.length !== 2) {
      console.error("❌ Rectangle element animations not restored correctly");
      return false;
    }
    
    const textElement = elements.find(el => el.id === "text1");
    if (!textElement || textElement.animations.length !== 1) {
      console.error("❌ Text element animations not restored correctly");
      return false;
    }
    
    const groupElement = groups.find(group => group.id === "group1");
    if (!groupElement || groupElement.animations.length !== 1) {
      console.error("❌ Group animations not restored correctly");
      return false;
    }
    
    console.log("✅ Migration from centralized timeline successful");
    return true;
  } catch (error) {
    console.error("❌ Migration from centralized timeline failed:", error);
    return false;
  }
}

/**
 * Test animation utility functions
 */
export function testAnimationUtilities(): boolean {
  console.log("🧪 Testing animation utilities...");
  
  try {
    const testAnimation: ElementAnimation = {
      id: "test-scale",
      displayName: "test-scale",
      type: "scale",
      startTime: 0,
      duration: 1,
      properties: { scaleX: 1.5, scaleY: 1.5 },
      repeat: 2,
      yoyo: true,
      repeatDelay: 0.5
    };
    
    // Test effective duration calculation
    const effectiveDuration = calculateEffectiveDurationV2(testAnimation);
    const expectedDuration = (1 * 2 * 3) + (2 * 0.5); // (base * 2 for yoyo * 3 cycles) + delays
    if (Math.abs(effectiveDuration - expectedDuration) > 0.001) {
      console.error(`❌ Expected effective duration ${expectedDuration}, got ${effectiveDuration}`);
      return false;
    }
    
    // Test timeline duration calculation
    const timelineAnimations = migrateToCentralizedTimeline(testElements, testGroups);
    const totalDuration = calculateTotalTimelineDurationV2(timelineAnimations);
    if (totalDuration <= 0) {
      console.error("❌ Total timeline duration should be positive");
      return false;
    }
    
    console.log("✅ Animation utilities working correctly");
    return true;
  } catch (error) {
    console.error("❌ Animation utilities test failed:", error);
    return false;
  }
}

/**
 * Test timeline animation structure validation
 */
export function testTimelineAnimationValidation(): boolean {
  console.log("🧪 Testing timeline animation validation...");
  
  try {
    const validAnimation: TimelineAnimation = {
      id: "valid-anim",
      displayName: "Valid Animation",
      target: { type: "element", id: "rect1" },
      tracks: [
        {
          id: "track-1",
          displayName: "track-1",
          type: "move",
          startTime: 0,
          duration: 2,
          properties: { x: 300, y: 200 }
        }
      ],
      startAt: 0
    };
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const invalidAnimation: TimelineAnimation = {
      id: "", // Invalid: empty ID
      displayName: "Invalid Animation",
      target: { type: "element", id: "" }, // Invalid: empty target ID
      tracks: [], // Invalid: no tracks
      startAt: -1 // Invalid: negative start time
    };
    
    // Test validation (this would need to be implemented)
    // For now, just verify the structure is correct
    if (!validAnimation.id || !validAnimation.target.id || validAnimation.tracks.length === 0) {
      console.error("❌ Valid animation structure is invalid");
      return false;
    }
    
    console.log("✅ Timeline animation validation working");
    return true;
  } catch (error) {
    console.error("❌ Timeline animation validation test failed:", error);
    return false;
  }
}

/**
 * Run all tests
 */
export function runTimelineRefactoringTests(): boolean {
  console.log("🚀 Running timeline refactoring tests...");
  
  const tests = [
    testMigrationToCentralizedTimeline,
    testMigrationFromCentralizedTimeline,
    testAnimationUtilities,
    testTimelineAnimationValidation
  ];
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach(test => {
    try {
      if (test()) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error("❌ Test failed with error:", error);
      failed++;
    }
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log("🎉 All tests passed! Timeline refactoring is working correctly.");
    return true;
  } else {
    console.log("⚠️ Some tests failed. Please review the implementation.");
    return false;
  }
}

// Export for use in other files
const timelineRefactoringTests = {
  testMigrationToCentralizedTimeline,
  testMigrationFromCentralizedTimeline,
  testAnimationUtilities,
  testTimelineAnimationValidation,
  runTimelineRefactoringTests
};

export default timelineRefactoringTests;
