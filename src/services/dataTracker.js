// Data tracking service for dashboard analytics
import { collection, addDoc, doc, updateDoc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

class DataTrackingService {
  constructor() {
    this.userId = this.getUserId();
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
  }

  // Generate a unique user ID (for now, use localStorage)
  getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  // Generate session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  // Track chatbot interactions
  async trackChatbotInteraction(question, response, subject, complexity) {
    try {
      const interactionData = {
        userId: this.userId,
        sessionId: this.sessionId,
        question: question.substring(0, 200), // Limit question length
        responseLength: response.length,
        subject: subject || 'general',
        complexity: complexity || 'basic',
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      };

      await addDoc(collection(db, 'chatbot_interactions'), interactionData);
      
      // Update daily stats
      await this.updateDailyStats('chatbot_questions', 1);
      await this.updateSubjectStats(subject);
      
      console.log('✅ Chatbot interaction tracked');
    } catch (error) {
      console.error('❌ Error tracking chatbot interaction:', error);
    }
  }

  // Track study session
  async trackStudySession(duration, subject = 'general') {
    try {
      const sessionData = {
        userId: this.userId,
        sessionId: this.sessionId,
        duration: duration, // in minutes
        subject: subject,
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'study_sessions'), sessionData);
      await this.updateDailyStats('study_minutes', duration);
      
      console.log('✅ Study session tracked:', duration, 'minutes');
    } catch (error) {
      console.error('❌ Error tracking study session:', error);
    }
  }

  // Track file upload
  async trackFileUpload(fileName, fileType, fileSize) {
    try {
      const uploadData = {
        userId: this.userId,
        fileName: fileName,
        fileType: fileType,
        fileSize: fileSize,
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'file_uploads'), uploadData);
      await this.updateDailyStats('files_uploaded', 1);
      
      console.log('✅ File upload tracked:', fileName);
    } catch (error) {
      console.error('❌ Error tracking file upload:', error);
    }
  }

  // Track document processing (new for IndexedDB storage)
  async trackDocumentProcessing(documentData) {
    try {
      const processingData = {
        userId: this.userId,
        documentId: documentData.id,
        fileName: documentData.name,
        fileType: documentData.type,
        fileSize: documentData.size,
        processingTime: documentData.processingTime,
        pageCount: documentData.pageCount,
        hasOriginalText: documentData.hasOriginalText,
        hasOCRText: documentData.hasOCRText,
        textLength: documentData.textLength,
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'document_processing'), processingData);
      await this.updateDailyStats('documents_processed', 1);
      
      console.log('✅ Document processing tracked:', documentData.name);
    } catch (error) {
      console.error('❌ Error tracking document processing:', error);
    }
  }

  // Track page visit
  async trackPageVisit(pageName) {
    try {
      const visitData = {
        userId: this.userId,
        sessionId: this.sessionId,
        page: pageName,
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'page_visits'), visitData);
      await this.updateDailyStats('pages_visited', 1);
      
      console.log('✅ Page visit tracked:', pageName);
    } catch (error) {
      console.error('❌ Error tracking page visit:', error);
    }
  }

  // Update daily statistics
  async updateDailyStats(metric, value) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyStatsRef = doc(db, 'daily_stats', `${this.userId}_${today}`);
      
      const docSnapshot = await getDoc(dailyStatsRef);
      
      if (docSnapshot.exists()) {
        await updateDoc(dailyStatsRef, {
          [metric]: increment(value),
          lastUpdated: serverTimestamp()
        });
      } else {
        await setDoc(dailyStatsRef, {
          userId: this.userId,
          date: today,
          [metric]: value,
          lastUpdated: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('❌ Error updating daily stats:', error);
    }
  }

  // Update subject statistics
  async updateSubjectStats(subject) {
    if (!subject || subject === 'general') return;
    
    try {
      const subjectStatsRef = doc(db, 'subject_stats', `${this.userId}_${subject}`);
      
      const docSnapshot = await getDoc(subjectStatsRef);
      
      if (docSnapshot.exists()) {
        await updateDoc(subjectStatsRef, {
          questions: increment(1),
          lastAccessed: serverTimestamp()
        });
      } else {
        await setDoc(subjectStatsRef, {
          userId: this.userId,
          subject: subject,
          questions: 1,
          lastAccessed: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('❌ Error updating subject stats:', error);
    }
  }

  // Track session end
  async trackSessionEnd() {
    try {
      const sessionDuration = Math.round((Date.now() - this.sessionStartTime) / (1000 * 60)); // in minutes
      
      const sessionData = {
        userId: this.userId,
        sessionId: this.sessionId,
        duration: sessionDuration,
        startTime: new Date(this.sessionStartTime),
        endTime: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'user_sessions'), sessionData);
      console.log('✅ Session ended:', sessionDuration, 'minutes');
    } catch (error) {
      console.error('❌ Error tracking session end:', error);
    }
  }

  // Get current session stats (for real-time display)
  getCurrentSessionStats() {
    const sessionDuration = Math.round((Date.now() - this.sessionStartTime) / (1000 * 60));
    return {
      sessionId: this.sessionId,
      duration: sessionDuration,
      startTime: new Date(this.sessionStartTime)
    };
  }
}

// Export singleton instance
export const dataTracker = new DataTrackingService();
export default dataTracker;
