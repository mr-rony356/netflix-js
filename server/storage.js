import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage {
  constructor() {
    this.usersMap = new Map();
    this.profilesMap = new Map();
    this.contentMap = new Map();
    this.reviewsMap = new Map();
    this.myListMap = new Map();
    this.logsMap = new Map();

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });

    this.userId = 1;
    this.profileId = 1;
    this.contentId = 1;
    this.reviewId = 1;
    this.logId = 1;
  }

  // User operations
  async getUser(id) {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email) {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByPhone(phone) {
    return Array.from(this.usersMap.values()).find(
      (user) => user.phone === phone
    );
  }

  async createUser(insertUser) {
    const id = this.userId++;
    const now = new Date();

    const user = {
      ...insertUser,
      id,
      createdAt: now,
      phone: insertUser.phone ?? null,
      isAdmin: insertUser.isAdmin ?? false,
    };

    this.usersMap.set(id, user);
    return user;
  }

  // Profile operations
  async getProfile(id) {
    return this.profilesMap.get(id);
  }

  async getProfilesByUserId(userId) {
    console.log("Fetching profiles for userId:", userId);
    console.log(
      "All profiles in storage:",
      Array.from(this.profilesMap.values())
    );

    const userProfiles = Array.from(this.profilesMap.values()).filter(
      (profile) => profile.userId === userId
    );

    console.log("Found profiles for userId:", userProfiles);
    return userProfiles;
  }

  async createProfile(insertProfile) {
    const id = this.profileId++;
    const now = new Date();
    const profile = { ...insertProfile, id, createdAt: now };
    this.profilesMap.set(id, profile);
    return profile;
  }

  async updateProfile(id, name) {
    const profile = this.profilesMap.get(id);
    if (!profile) return undefined;

    const updatedProfile = { ...profile, name };
    this.profilesMap.set(id, updatedProfile);
    return updatedProfile;
  }

  async deleteProfile(id) {
    return this.profilesMap.delete(id);
  }

  // Content operations
  async getContent(id) {
    return this.contentMap.get(id);
  }

  async getContentByTmdbId(tmdbId) {
    return Array.from(this.contentMap.values()).find(
      (content) => content.tmdbId === tmdbId
    );
  }

  async createContent(insertContent) {
    const id = this.contentId++;
    const now = new Date();
    const contentItem = {
      ...insertContent,
      id,
      addedAt: now,
      addedBy: insertContent.addedBy ?? null,
    };
    this.contentMap.set(id, contentItem);
    return contentItem;
  }

  async getAllContent(page = 1, limit = 20) {
    const allContent = Array.from(this.contentMap.values());
    const start = (page - 1) * limit;
    return allContent.slice(start, start + limit);
  }

  async getContentByType(type, page = 1, limit = 20) {
    const filteredContent = Array.from(this.contentMap.values()).filter(
      (content) => content.type === type
    );
    const start = (page - 1) * limit;
    return filteredContent.slice(start, start + limit);
  }

  async getLatestContent(page = 1, limit = 20) {
    const allContent = Array.from(this.contentMap.values()).sort(
      (a, b) => b.addedAt.getTime() - a.addedAt.getTime()
    );
    const start = (page - 1) * limit;
    return allContent.slice(start, start + limit);
  }

  // Review operations
  async getReview(id) {
    return this.reviewsMap.get(id);
  }

  async getReviewsByContentId(contentId) {
    return Array.from(this.reviewsMap.values()).filter(
      (review) => review.contentId === contentId
    );
  }

  async getReviewsByProfileId(profileId) {
    return Array.from(this.reviewsMap.values()).filter(
      (review) => review.profileId === profileId
    );
  }

  async createReview(insertReview) {
    const id = this.reviewId++;
    const now = new Date();
    const review = {
      ...insertReview,
      id,
      createdAt: now,
      rating: insertReview.rating ?? null,
      review: insertReview.review ?? null,
      isPublic: insertReview.isPublic ?? false,
    };
    this.reviewsMap.set(id, review);
    return review;
  }

  async updateReview(id, reviewUpdate) {
    const review = this.reviewsMap.get(id);
    if (!review) return undefined;

    const updatedReview = { ...review, ...reviewUpdate };
    this.reviewsMap.set(id, updatedReview);
    return updatedReview;
  }

  async deleteReview(id) {
    return this.reviewsMap.delete(id);
  }

  // MyList operations
  async addToMyList(insertMyList) {
    const key = `${insertMyList.profileId}-${insertMyList.contentId}`;
    const now = new Date();
    const myListItem = { ...insertMyList, addedAt: now };
    this.myListMap.set(key, myListItem);
    return myListItem;
  }

  async removeFromMyList(profileId, contentId) {
    const key = `${profileId}-${contentId}`;
    return this.myListMap.delete(key);
  }

  async getMyList(profileId) {
    return Array.from(this.myListMap.values()).filter(
      (item) => item.profileId === profileId
    );
  }

  async isInMyList(profileId, contentId) {
    const key = `${profileId}-${contentId}`;
    return this.myListMap.has(key);
  }

  // Log operations
  async createLog(insertLog) {
    const id = this.logId++;
    const now = new Date();
    const log = {
      ...insertLog,
      id,
      timestamp: now,
      userId: insertLog.userId ?? null,
      details: insertLog.details ?? null,
    };
    this.logsMap.set(id, log);
    return log;
  }

  async getLogs(page = 1, limit = 20) {
    const allLogs = Array.from(this.logsMap.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    const start = (page - 1) * limit;
    return allLogs.slice(start, start + limit);
  }
}

export const storage = new MemStorage();
