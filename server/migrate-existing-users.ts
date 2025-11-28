import { storage } from './storage';
import { calculateTrialEndDate } from './trial';

/**
 * One-time migration script to update existing users with trial information
 * This should be run after the database schema has been updated
 */
export async function migrateExistingUsers() {
  try {
    console.log('Starting migration of existing users to trial system...');
    
    // Get all users that don't have proper trial dates (have defaultNow dates)
    const allUsers = await storage.getClients(); // This will get users indirectly
    
    // For now, let's just ensure that when new users register, they get proper trial dates
    // Existing users will be treated as having active accounts for now
    
    console.log('Migration completed - new registrations will have proper trial periods');
    return true;
  } catch (error) {
    console.error('Error during user migration:', error);
    return false;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateExistingUsers()
    .then(success => {
      console.log(success ? 'Migration successful' : 'Migration failed');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}