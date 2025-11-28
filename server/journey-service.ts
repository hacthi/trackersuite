import { db } from "./db";
import { 
  userJourneyMilestones, 
  userJourneyProgress, 
  clients, 
  followUps, 
  interactions,
  type InsertUserJourneyMilestone, 
  type InsertUserJourneyProgress 
} from "@shared/schema";
import { eq, and, count, desc } from "drizzle-orm";

// Milestone definitions with their requirements
const MILESTONE_DEFINITIONS = {
  account_created: {
    title: "Welcome Aboard!",
    description: "Successfully created your account",
    category: "getting_started" as const,
    points: 10,
    autoComplete: true,
  },
  profile_completed: {
    title: "Profile Complete",
    description: "Filled out your complete profile information",
    category: "getting_started" as const,
    points: 15,
    autoComplete: false,
  },
  trial_started: {
    title: "Trial Journey Begins",
    description: "Started your 7-day free trial",
    category: "getting_started" as const,
    points: 5,
    autoComplete: true,
  },
  first_client_added: {
    title: "First Client Added",
    description: "Added your first client to the system",
    category: "client_management" as const,
    points: 20,
    autoComplete: true,
  },
  first_follow_up_scheduled: {
    title: "Staying Organized",
    description: "Scheduled your first follow-up task",
    category: "client_management" as const,
    points: 15,
    autoComplete: true,
  },
  first_interaction_logged: {
    title: "Communication Tracker",
    description: "Logged your first client interaction",
    category: "engagement" as const,
    points: 15,
    autoComplete: true,
  },
  first_email_sent: {
    title: "Direct Communication",
    description: "Sent your first email through the platform",
    category: "engagement" as const,
    points: 20,
    autoComplete: true,
  },
  first_export: {
    title: "Data Export Master",
    description: "Exported your first data report",
    category: "advanced" as const,
    points: 25,
    autoComplete: true,
  },
  five_clients_milestone: {
    title: "Growing Network",
    description: "Reached 5 clients in your network",
    category: "growth" as const,
    points: 30,
    autoComplete: true,
  },
  ten_follow_ups_milestone: {
    title: "Follow-up Pro",
    description: "Scheduled 10 follow-up tasks",
    category: "client_management" as const,
    points: 25,
    autoComplete: true,
  },
  twenty_clients_milestone: {
    title: "Network Expansion",
    description: "Reached 20 clients in your network",
    category: "growth" as const,
    points: 50,
    autoComplete: true,
  },
  fifty_interactions_milestone: {
    title: "Engagement Champion",
    description: "Logged 50 client interactions",
    category: "engagement" as const,
    points: 40,
    autoComplete: true,
  },
  advanced_reporting_used: {
    title: "Analytics Expert",
    description: "Used the advanced reporting features",
    category: "advanced" as const,
    points: 30,
    autoComplete: true,
  },
  account_upgraded: {
    title: "Premium Member",
    description: "Upgraded to a premium account",
    category: "advanced" as const,
    points: 100,
    autoComplete: true,
  },
};

// Journey stage requirements
const STAGE_REQUIREMENTS = {
  onboarding: { minPoints: 0, minMilestones: 0 },
  exploring: { minPoints: 50, minMilestones: 3 },
  active: { minPoints: 150, minMilestones: 8 },
  power_user: { minPoints: 300, minMilestones: 12 },
  expert: { minPoints: 500, minMilestones: 15 },
};

export class JourneyService {
  // Initialize user journey when they sign up
  static async initializeUserJourney(userId: number): Promise<void> {
    try {
      // Create progress entry
      await db.insert(userJourneyProgress).values({
        userId,
        totalPoints: 0,
        completedMilestones: 0,
        currentLevel: 1,
        journeyStage: "onboarding",
      }).onConflictDoNothing();

      // Create initial milestones
      const initialMilestones = [
        {
          userId,
          milestoneType: "account_created" as const,
          ...MILESTONE_DEFINITIONS.account_created,
          isCompleted: true,
          completedAt: new Date(),
        },
        {
          userId,
          milestoneType: "trial_started" as const,
          ...MILESTONE_DEFINITIONS.trial_started,
          isCompleted: true,
          completedAt: new Date(),
        },
      ];

      // Add all other milestones as not completed
      Object.entries(MILESTONE_DEFINITIONS).forEach(([key, definition]) => {
        if (key !== "account_created" && key !== "trial_started") {
          initialMilestones.push({
            userId,
            milestoneType: key as keyof typeof MILESTONE_DEFINITIONS,
            ...definition,
            isCompleted: false,
            completedAt: null,
          });
        }
      });

      await db.insert(userJourneyMilestones).values(initialMilestones).onConflictDoNothing();

      // Update progress with initial points
      await this.updateUserProgress(userId);

      console.log(`[JourneyService] Initialized journey for user ${userId}`);
    } catch (error) {
      console.error(`[JourneyService] Error initializing user journey:`, error);
    }
  }

  // Check and complete milestone
  static async checkAndCompleteMilestone(
    userId: number, 
    milestoneType: keyof typeof MILESTONE_DEFINITIONS
  ): Promise<boolean> {
    try {
      // Check if milestone already completed
      const existingMilestone = await db.select()
        .from(userJourneyMilestones)
        .where(
          and(
            eq(userJourneyMilestones.userId, userId),
            eq(userJourneyMilestones.milestoneType, milestoneType)
          )
        )
        .limit(1);

      if (existingMilestone.length > 0 && existingMilestone[0].isCompleted) {
        return false; // Already completed
      }

      // Verify milestone requirements are met
      const requirementsMet = await this.verifyMilestoneRequirements(userId, milestoneType);
      
      if (!requirementsMet) {
        return false;
      }

      // Complete the milestone
      await db.update(userJourneyMilestones)
        .set({
          isCompleted: true,
          completedAt: new Date(),
        })
        .where(
          and(
            eq(userJourneyMilestones.userId, userId),
            eq(userJourneyMilestones.milestoneType, milestoneType)
          )
        );

      // Update user progress
      await this.updateUserProgress(userId);

      console.log(`[JourneyService] Completed milestone ${milestoneType} for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`[JourneyService] Error completing milestone:`, error);
      return false;
    }
  }

  // Verify if milestone requirements are met
  static async verifyMilestoneRequirements(
    userId: number, 
    milestoneType: keyof typeof MILESTONE_DEFINITIONS
  ): Promise<boolean> {
    try {
      switch (milestoneType) {
        case "first_client_added":
          const clientCount = await db.select({ count: count() })
            .from(clients)
            .where(eq(clients.userId, userId));
          return clientCount[0].count >= 1;

        case "first_follow_up_scheduled":
          const followUpCount = await db.select({ count: count() })
            .from(followUps)
            .where(eq(followUps.userId, userId));
          return followUpCount[0].count >= 1;

        case "first_interaction_logged":
          const interactionCount = await db.select({ count: count() })
            .from(interactions)
            .where(eq(interactions.userId, userId));
          return interactionCount[0].count >= 1;

        case "five_clients_milestone":
          const fiveClientCount = await db.select({ count: count() })
            .from(clients)
            .where(eq(clients.userId, userId));
          return fiveClientCount[0].count >= 5;

        case "ten_follow_ups_milestone":
          const tenFollowUpCount = await db.select({ count: count() })
            .from(followUps)
            .where(eq(followUps.userId, userId));
          return tenFollowUpCount[0].count >= 10;

        case "twenty_clients_milestone":
          const twentyClientCount = await db.select({ count: count() })
            .from(clients)
            .where(eq(clients.userId, userId));
          return twentyClientCount[0].count >= 20;

        case "fifty_interactions_milestone":
          const fiftyInteractionCount = await db.select({ count: count() })
            .from(interactions)
            .where(eq(interactions.userId, userId));
          return fiftyInteractionCount[0].count >= 50;

        default:
          return true; // For milestones that are manually triggered
      }
    } catch (error) {
      console.error(`[JourneyService] Error verifying milestone requirements:`, error);
      return false;
    }
  }

  // Update user progress and journey stage
  static async updateUserProgress(userId: number): Promise<void> {
    try {
      // Get completed milestones
      const completedMilestones = await db.select()
        .from(userJourneyMilestones)
        .where(
          and(
            eq(userJourneyMilestones.userId, userId),
            eq(userJourneyMilestones.isCompleted, true)
          )
        );

      const totalPoints = completedMilestones.reduce((sum, milestone) => sum + milestone.points, 0);
      const milestoneCount = completedMilestones.length;

      // Determine journey stage
      let journeyStage: "onboarding" | "exploring" | "active" | "power_user" | "expert" = "onboarding";
      
      if (totalPoints >= STAGE_REQUIREMENTS.expert.minPoints && milestoneCount >= STAGE_REQUIREMENTS.expert.minMilestones) {
        journeyStage = "expert";
      } else if (totalPoints >= STAGE_REQUIREMENTS.power_user.minPoints && milestoneCount >= STAGE_REQUIREMENTS.power_user.minMilestones) {
        journeyStage = "power_user";
      } else if (totalPoints >= STAGE_REQUIREMENTS.active.minPoints && milestoneCount >= STAGE_REQUIREMENTS.active.minMilestones) {
        journeyStage = "active";
      } else if (totalPoints >= STAGE_REQUIREMENTS.exploring.minPoints && milestoneCount >= STAGE_REQUIREMENTS.exploring.minMilestones) {
        journeyStage = "exploring";
      }

      // Calculate level (every 50 points = 1 level)
      const currentLevel = Math.floor(totalPoints / 50) + 1;

      // Update progress
      await db.update(userJourneyProgress)
        .set({
          totalPoints,
          completedMilestones: milestoneCount,
          currentLevel,
          journeyStage,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userJourneyProgress.userId, userId));

      console.log(`[JourneyService] Updated progress for user ${userId}: ${totalPoints} points, ${milestoneCount} milestones, ${journeyStage} stage`);
    } catch (error) {
      console.error(`[JourneyService] Error updating user progress:`, error);
    }
  }

  // Check all possible milestones for a user
  static async checkAllMilestones(userId: number): Promise<string[]> {
    const completed: string[] = [];
    
    for (const milestoneType of Object.keys(MILESTONE_DEFINITIONS) as Array<keyof typeof MILESTONE_DEFINITIONS>) {
      const definition = MILESTONE_DEFINITIONS[milestoneType];
      if (definition.autoComplete) {
        const wasCompleted = await this.checkAndCompleteMilestone(userId, milestoneType);
        if (wasCompleted) {
          completed.push(milestoneType);
        }
      }
    }

    return completed;
  }

  // Get user journey data
  static async getUserJourneyData(userId: number) {
    try {
      const [progress, milestones] = await Promise.all([
        db.select()
          .from(userJourneyProgress)
          .where(eq(userJourneyProgress.userId, userId))
          .limit(1),
        db.select()
          .from(userJourneyMilestones)
          .where(eq(userJourneyMilestones.userId, userId))
          .orderBy(desc(userJourneyMilestones.createdAt))
      ]);

      return {
        progress: progress[0] || null,
        milestones: milestones || [],
      };
    } catch (error) {
      console.error(`[JourneyService] Error getting user journey data:`, error);
      return { progress: null, milestones: [] };
    }
  }
}

export default JourneyService;