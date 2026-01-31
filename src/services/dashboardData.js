// Dashboard data service to fetch real analytics from Firebase
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import dataTracker from './dataTracker';

class DashboardDataService {
  constructor() {
    this.userId = dataTracker.getUserId();
  }

  // Get today's statistics
  async getTodayStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyStatsRef = doc(db, 'daily_stats', `${this.userId}_${today}`);
      const docSnapshot = await getDoc(dailyStatsRef);
      
      const currentSession = dataTracker.getCurrentSessionStats();
      
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        return {
          studyMinutes: data.study_minutes || 0,
          questionsAsked: data.chatbot_questions || 0,
          filesUploaded: data.files_uploaded || 0,
          documentsProcessed: data.documents_processed || 0,
          pagesVisited: data.pages_visited || 0,
          currentSessionMinutes: currentSession.duration,
          lastUpdated: data.lastUpdated
        };
      } else {
        return {
          studyMinutes: 0,
          questionsAsked: 0,
          filesUploaded: 0,
          documentsProcessed: 0,
          pagesVisited: 0,
          currentSessionMinutes: currentSession.duration,
          lastUpdated: null
        };
      }
    } catch (error) {
      console.error('❌ Error fetching today stats:', error);
      return {
        studyMinutes: 0,
        questionsAsked: 0,
        filesUploaded: 0,
        pagesVisited: 0,
        currentSessionMinutes: 0,
        lastUpdated: null
      };
    }
  }

  // Get weekly study streak
  async getStudyStreak() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      
      const q = query(
        collection(db, 'daily_stats'),
        where('userId', '==', this.userId),
        where('date', '>=', startDate.toISOString().split('T')[0]),
        where('date', '<=', endDate.toISOString().split('T')[0]),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      let streak = 0;
      let consecutiveDays = true;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (consecutiveDays && (data.chatbot_questions > 0 || data.study_minutes > 0)) {
          streak++;
        } else {
          consecutiveDays = false;
        }
      });
      
      return streak;
    } catch (error) {
      console.error('❌ Error fetching study streak:', error);
      return 0;
    }
  }

  // Get subject breakdown
  async getSubjectBreakdown() {
    try {
      const q = query(
        collection(db, 'subject_stats'),
        where('userId', '==', this.userId),
        orderBy('questions', 'desc'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      const subjects = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        subjects.push({
          name: data.subject,
          questions: data.questions,
          lastAccessed: data.lastAccessed
        });
      });
      
      return subjects;
    } catch (error) {
      console.error('❌ Error fetching subject breakdown:', error);
      return [];
    }
  }

  // Get recent chatbot interactions
  async getRecentInteractions(limitCount = 10) {
    try {
      const q = query(
        collection(db, 'chatbot_interactions'),
        where('userId', '==', this.userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const interactions = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        interactions.push({
          id: doc.id,
          question: data.question,
          subject: data.subject,
          complexity: data.complexity,
          timestamp: data.timestamp,
          responseLength: data.responseLength
        });
      });
      
      return interactions;
    } catch (error) {
      console.error('❌ Error fetching recent interactions:', error);
      return [];
    }
  }

  // Get weekly activity chart data
  async getWeeklyActivity() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      
      const q = query(
        collection(db, 'daily_stats'),
        where('userId', '==', this.userId),
        where('date', '>=', startDate.toISOString().split('T')[0]),
        where('date', '<=', endDate.toISOString().split('T')[0]),
        orderBy('date', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Raw activity docs:', querySnapshot.docs.map(doc => doc.data()));
      const activityData = [];
      
      // Create array for all 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        activityData.push({
          date: dateStr,
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          questions: 0,
          studyMinutes: 0,
          filesUploaded: 0
        });
      }
      
      // Fill in actual data
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const dayIndex = activityData.findIndex(day => day.date === data.date);
        if (dayIndex !== -1) {
          activityData[dayIndex].questions = data.chatbot_questions || 0;
          activityData[dayIndex].studyMinutes = data.study_minutes || 0;
          activityData[dayIndex].filesUploaded = data.files_uploaded || 0;
        }
      });
      
      return activityData;
    } catch (error) {
      console.error('❌ Error fetching weekly activity:', error);
      return [];
    }
  }

  // Get learning insights
  async getLearningInsights() {
    try {
      const [todayStats, subjects, recentInteractions] = await Promise.all([
        this.getTodayStats(),
        this.getSubjectBreakdown(),
        this.getRecentInteractions(5)
      ]);
      
      const insights = [];
      
      // Most active subject
      if (subjects.length > 0) {
        insights.push({
          type: 'subject',
          message: `You're most active in ${subjects[0].name} with ${subjects[0].questions} questions!`,
          icon: '📚'
        });
      }
      
      // Daily progress
      if (todayStats.questionsAsked > 5) {
        insights.push({
          type: 'progress',
          message: `Great job! You've asked ${todayStats.questionsAsked} questions today.`,
          icon: '🎯'
        });
      }
      
      // Study session
      if (todayStats.currentSessionMinutes > 10) {
        insights.push({
          type: 'session',
          message: `You've been studying for ${todayStats.currentSessionMinutes} minutes this session!`,
          icon: '⏰'
        });
      }
      
      return insights;
    } catch (error) {
      console.error('❌ Error generating insights:', error);
      return [];
    }
  }

  // Get local document storage stats (IndexedDB)
  async getLocalDocumentStats() {
    try {
      const { documentStorage } = await import('./documentStorage');
      return await documentStorage.getStorageStats();
    } catch (error) {
      console.error('❌ Error fetching local document stats:', error);
      return {
        totalDocuments: 0,
        totalSizeMB: '0',
        totalTextLength: 0,
        fileTypes: {},
        recentDocuments: []
      };
    }
  }
}

// Export singleton instance
export const dashboardData = new DashboardDataService();
export default dashboardData;
