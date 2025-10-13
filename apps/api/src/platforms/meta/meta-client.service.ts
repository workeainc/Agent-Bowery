import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - use ambient module declaration for SDK in tests
import { FacebookAdsApi, Page, InstagramAccount } from 'facebook-nodejs-business-sdk';
import axios from 'axios';

export interface MetaPostContent {
  message: string;
  link?: string;
  imageUrl?: string;
  videoUrl?: string;
  scheduledPublishTime?: number;
  // Instagram specific
  mediaType?: 'photo' | 'video' | 'carousel' | 'story' | 'reel' | 'igtv';
  carouselUrls?: string[];
  storyBackground?: string;
  storyStickers?: any[];
  reelMusic?: string;
  reelEffects?: string[];
  igtvTitle?: string;
  igtvDescription?: string;
}

export interface MetaPostResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
  platform?: 'facebook' | 'instagram' | 'instagram_story' | 'instagram_reel' | 'instagram_igtv' | 'instagram_carousel';
}

export interface MetaPageInfo {
  id: string;
  name: string;
  accessToken: string;
  category: string;
}

export interface InstagramAccountInfo {
  id: string;
  username: string;
  accountType: 'BUSINESS' | 'CREATOR';
  followersCount: number;
}

@Injectable()
export class MetaClientService {
  private readonly logger = new Logger(MetaClientService.name);
  private readonly graphApiUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    // Initialize Facebook SDK only if credentials are available
    if (process.env.META_APP_ID && process.env.META_APP_SECRET) {
      FacebookAdsApi.init(process.env.META_APP_ID, process.env.META_APP_SECRET);
    }
  }

  /**
   * Get user's Facebook pages
   */
  async getUserPages(accessToken: string): Promise<MetaPageInfo[]> {
    try {
      const response = await axios.get(`${this.graphApiUrl}/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,category,access_token'
        }
      });

      return response.data.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
        category: page.category
      }));
    } catch (error: any) {
      this.logger.error('Failed to get user pages:', error);
      throw new Error(`Failed to get Facebook pages: ${error?.response?.data?.error?.message || error?.message}`);
    }
  }

  /**
   * Get Instagram business accounts connected to Facebook pages
   */
  async getInstagramAccounts(pageAccessToken: string, pageId: string): Promise<InstagramAccountInfo[]> {
    try {
      const response = await axios.get(`${this.graphApiUrl}/${pageId}/instagram_accounts`, {
        params: {
          access_token: pageAccessToken,
          fields: 'id,username,account_type,followers_count'
        }
      });

      return response.data.data.map((account: any) => ({
        id: account.id,
        username: account.username,
        accountType: account.account_type,
        followersCount: account.followers_count
      }));
    } catch (error: any) {
      this.logger.error('Failed to get Instagram accounts:', error);
      throw new Error(`Failed to get Instagram accounts: ${error?.response?.data?.error?.message || error?.message}`);
    }
  }

  /**
   * Publish a post to Facebook page
   */
  async publishFacebookPost(pageId: string, pageAccessToken: string, content: MetaPostContent): Promise<MetaPostResult> {
    try {
      const postData: any = {
        message: content.message,
        access_token: pageAccessToken
      };

      // Add link if provided
      if (content.link) {
        postData.link = content.link;
      }

      // Add scheduled publish time if provided
      if (content.scheduledPublishTime) {
        postData.scheduled_publish_time = content.scheduledPublishTime;
        postData.published = false;
      }

      const response = await axios.post(`${this.graphApiUrl}/${pageId}/feed`, postData);

      return {
        success: true,
        postId: response.data.id,
        url: `https://facebook.com/posts/${response.data.id}`,
        platform: 'facebook'
      };
    } catch (error: any) {
      this.logger.error('Failed to publish Facebook post:', error);
      return {
        success: false,
        error: error?.response?.data?.error?.message || error?.message,
        platform: 'facebook'
      };
    }
  }

  /**
   * Upload photo to Facebook page
   */
  async uploadFacebookPhoto(pageId: string, pageAccessToken: string, imageBuffer: Buffer, caption?: string): Promise<MetaPostResult> {
    try {
      const formData = new FormData();
      formData.append('access_token', pageAccessToken);
      // In Node.js runtime, allow Buffer as file content
      formData.append('source', imageBuffer as unknown as Blob);
      if (caption) {
        formData.append('message', caption);
      }

      const response = await axios.post(`${this.graphApiUrl}/${pageId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        postId: response.data.id,
        url: `https://facebook.com/photos/${response.data.id}`,
        platform: 'facebook'
      };
    } catch (error: any) {
      this.logger.error('Failed to upload Facebook photo:', error);
      return {
        success: false,
        error: error?.response?.data?.error?.message || error?.message,
        platform: 'facebook'
      };
    }
  }

  /**
   * Publish a post to Instagram business account
   */
  async publishInstagramPost(instagramAccountId: string, pageAccessToken: string, content: MetaPostContent): Promise<MetaPostResult> {
    try {
      // Step 1: Create media container
      const mediaData: any = {
        access_token: pageAccessToken,
        caption: content.message
      };

      if (content.imageUrl) {
        mediaData.image_url = content.imageUrl;
      } else if (content.videoUrl) {
        mediaData.video_url = content.videoUrl;
      } else {
        throw new Error('Instagram posts require either image_url or video_url');
      }

      const mediaResponse = await axios.post(`${this.graphApiUrl}/${instagramAccountId}/media`, mediaData);
      const creationId = mediaResponse.data.id;

      // Step 2: Publish the media
      const publishResponse = await axios.post(`${this.graphApiUrl}/${instagramAccountId}/media_publish`, {
        access_token: pageAccessToken,
        creation_id: creationId
      });

      return {
        success: true,
        postId: publishResponse.data.id,
        url: `https://instagram.com/p/${publishResponse.data.id}`,
        platform: 'instagram'
      };
    } catch (error: any) {
      this.logger.error('Failed to publish Instagram post:', error);
      return {
        success: false,
        error: error?.response?.data?.error?.message || error?.message,
        platform: 'instagram'
      };
    }
  }

  /**
   * Upload photo to Instagram business account
   */
  async uploadInstagramPhoto(instagramAccountId: string, pageAccessToken: string, imageBuffer: Buffer, caption: string): Promise<MetaPostResult> {
    try {
      // Step 1: Upload image to temporary storage
      const formData = new FormData();
      formData.append('access_token', pageAccessToken);
      formData.append('image_url', 'data:image/jpeg;base64,' + imageBuffer.toString('base64'));

      const mediaResponse = await axios.post(`${this.graphApiUrl}/${instagramAccountId}/media`, {
        access_token: pageAccessToken,
        image_url: 'data:image/jpeg;base64,' + imageBuffer.toString('base64'),
        caption: caption
      });

      const creationId = mediaResponse.data.id;

      // Step 2: Publish the media
      const publishResponse = await axios.post(`${this.graphApiUrl}/${instagramAccountId}/media_publish`, {
        access_token: pageAccessToken,
        creation_id: creationId
      });

      return {
        success: true,
        postId: publishResponse.data.id,
        url: `https://instagram.com/p/${publishResponse.data.id}`,
        platform: 'instagram'
      };
    } catch (error: any) {
      this.logger.error('Failed to upload Instagram photo:', error);
      return {
        success: false,
        error: error?.response?.data?.error?.message || error?.message,
        platform: 'instagram'
      };
    }
  }

  /**
   * Publish Instagram Story
   */
  async publishInstagramStory(instagramAccountId: string, pageAccessToken: string, content: MetaPostContent): Promise<MetaPostResult> {
    try {
      const mediaData: any = {
        access_token: pageAccessToken,
        media_type: 'STORIES'
      };

      if (content.imageUrl) {
        mediaData.image_url = content.imageUrl;
      } else if (content.videoUrl) {
        mediaData.video_url = content.videoUrl;
      } else {
        throw new Error('Instagram stories require either image_url or video_url');
      }

      // Add story-specific elements
      if (content.storyBackground) {
        mediaData.background_color = content.storyBackground;
      }

      const mediaResponse = await axios.post(`${this.graphApiUrl}/${instagramAccountId}/media`, mediaData);
      const creationId = mediaResponse.data.id;

      // Publish the story
      const publishResponse = await axios.post(`${this.graphApiUrl}/${instagramAccountId}/media_publish`, {
        access_token: pageAccessToken,
        creation_id: creationId
      });

      return {
        success: true,
        postId: publishResponse.data.id,
        url: `https://instagram.com/stories/${instagramAccountId}/${publishResponse.data.id}`,
        platform: 'instagram_story'
      };
    } catch (error: any) {
      this.logger.error('Failed to publish Instagram story:', error);
      return {
        success: false,
        error: error?.response?.data?.error?.message || error?.message,
        platform: 'instagram_story'
      };
    }
  }

  /**
   * Publish Instagram Reel
   */
  async publishInstagramReel(instagramAccountId: string, pageAccessToken: string, content: MetaPostContent): Promise<MetaPostResult> {
    try {
      if (!content.videoUrl) {
        throw new Error('Instagram reels require video_url');
      }

      const mediaData: any = {
        access_token: pageAccessToken,
        media_type: 'REELS',
        video_url: content.videoUrl,
        caption: content.message
      };

      // Add reel-specific elements
      if (content.reelMusic) {
        mediaData.audio_name = content.reelMusic;
      }

      const mediaResponse = await axios.post(`${this.graphApiUrl}/${instagramAccountId}/media`, mediaData);
      const creationId = mediaResponse.data.id;

      // Publish the reel
      const publishResponse = await axios.post(`${this.graphApiUrl}/${instagramAccountId}/media_publish`, {
        access_token: pageAccessToken,
        creation_id: creationId
      });

      return {
        success: true,
        postId: publishResponse.data.id,
        url: `https://instagram.com/reel/${publishResponse.data.id}`,
        platform: 'instagram_reel'
      };
    } catch (error: any) {
      this.logger.error('Failed to publish Instagram reel:', error);
      return {
        success: false,
        error: error?.response?.data?.error?.message || error?.message,
        platform: 'instagram_reel'
      };
    }
  }

  /**
   * Publish Instagram IGTV
   */
  async publishInstagramIGTV(instagramAccountId: string, pageAccessToken: string, content: MetaPostContent): Promise<MetaPostResult> {
    try {
      if (!content.videoUrl) {
        throw new Error('Instagram IGTV requires video_url');
      }

      const mediaData: any = {
        access_token: pageAccessToken,
        media_type: 'VIDEO',
        video_url: content.videoUrl,
        caption: content.message
      };

      // Add IGTV-specific elements
      if (content.igtvTitle) {
        mediaData.title = content.igtvTitle;
      }
      if (content.igtvDescription) {
        mediaData.description = content.igtvDescription;
      }

      const mediaResponse = await axios.post(`${this.graphApiUrl}/${instagramAccountId}/media`, mediaData);
      const creationId = mediaResponse.data.id;

      // Publish the IGTV
      const publishResponse = await axios.post(`${this.graphApiUrl}/${instagramAccountId}/media_publish`, {
        access_token: pageAccessToken,
        creation_id: creationId
      });

      return {
        success: true,
        postId: publishResponse.data.id,
        url: `https://instagram.com/tv/${publishResponse.data.id}`,
        platform: 'instagram_igtv'
      };
    } catch (error: any) {
      this.logger.error('Failed to publish Instagram IGTV:', error);
      return {
        success: false,
        error: error?.response?.data?.error?.message || error?.message,
        platform: 'instagram_igtv'
      };
    }
  }

  /**
   * Publish Instagram Carousel (multiple images)
   */
  async publishInstagramCarousel(instagramAccountId: string, pageAccessToken: string, content: MetaPostContent): Promise<MetaPostResult> {
    try {
      if (!content.carouselUrls || content.carouselUrls.length < 2) {
        throw new Error('Instagram carousel requires at least 2 images');
      }

      // Create media containers for each image
      const mediaContainers = [];
      for (const imageUrl of content.carouselUrls) {
        const mediaData = {
          access_token: pageAccessToken,
          image_url: imageUrl,
          is_carousel_item: true
        };

        const mediaResponse = await axios.post(`${this.graphApiUrl}/${instagramAccountId}/media`, mediaData);
        mediaContainers.push(mediaResponse.data.id);
      }

      // Create carousel container
      const carouselData = {
        access_token: pageAccessToken,
        media_type: 'CAROUSEL',
        children: mediaContainers.join(','),
        caption: content.message
      };

      const carouselResponse = await axios.post(`${this.graphApiUrl}/${instagramAccountId}/media`, carouselData);
      const creationId = carouselResponse.data.id;

      // Publish the carousel
      const publishResponse = await axios.post(`${this.graphApiUrl}/${instagramAccountId}/media_publish`, {
        access_token: pageAccessToken,
        creation_id: creationId
      });

      return {
        success: true,
        postId: publishResponse.data.id,
        url: `https://instagram.com/p/${publishResponse.data.id}`,
        platform: 'instagram_carousel'
      };
    } catch (error: any) {
      this.logger.error('Failed to publish Instagram carousel:', error);
      return {
        success: false,
        error: error?.response?.data?.error?.message || error?.message,
        platform: 'instagram_carousel'
      };
    }
  }

  /**
   * Get post insights/analytics
   */
  async getPostInsights(postId: string, accessToken: string): Promise<any> {
    try {
      const response = await axios.get(`${this.graphApiUrl}/${postId}/insights`, {
        params: {
          access_token: accessToken,
          metric: 'post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total'
        }
      });

      return response.data.data.reduce((acc: any, insight: any) => {
        acc[insight.name] = insight.values[0]?.value || 0;
        return acc;
      }, {});
    } catch (error: any) {
      this.logger.error('Failed to get post insights:', error);
      return {};
    }
  }

  /**
   * Get page insights
   */
  async getPageInsights(pageId: string, accessToken: string, dateRange: { since: string; until: string }): Promise<any> {
    try {
      const response = await axios.get(`${this.graphApiUrl}/${pageId}/insights`, {
        params: {
          access_token: accessToken,
          metric: 'page_fans,page_impressions,page_engaged_users',
          since: dateRange.since,
          until: dateRange.until,
          period: 'day'
        }
      });

      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to get page insights:', error);
      return [];
    }
  }

  /**
   * Reply to a comment
   */
  async replyToComment(commentId: string, accessToken: string, message: string): Promise<boolean> {
    try {
      await axios.post(`${this.graphApiUrl}/${commentId}/comments`, {
        access_token: accessToken,
        message: message
      });

      return true;
    } catch (error: any) {
      this.logger.error('Failed to reply to comment:', error);
      return false;
    }
  }

  /**
   * Get comments for a post
   */
  async getPostComments(postId: string, accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.graphApiUrl}/${postId}/comments`, {
        params: {
          access_token: accessToken,
          fields: 'id,message,from,created_time,like_count'
        }
      });

      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to get post comments:', error);
      return [];
    }
  }

  /**
   * Validate access token
   */
  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.graphApiUrl}/me`, {
        params: {
          access_token: accessToken,
          fields: 'id,name'
        }
      });

      return !!response.data.id;
    } catch (error: any) {
      this.logger.error('Access token validation failed:', error);
      return false;
    }
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  async exchangeToken(shortLivedToken: string): Promise<{ accessToken: string; expiresIn: number } | null> {
    try {
      const response = await axios.get(`${this.graphApiUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: shortLivedToken
        }
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } catch (error: any) {
      this.logger.error('Token exchange failed:', error);
      return null;
    }
  }
}
