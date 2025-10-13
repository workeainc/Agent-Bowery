import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface LinkedInPostContent {
  text: string;
  visibility: 'PUBLIC' | 'CONNECTIONS';
  media?: {
    title: string;
    description: string;
    mediaUrl: string;
  };
}

export interface LinkedInPostResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

export interface LinkedInCompanyInfo {
  id: string;
  name: string;
  description: string;
  website: string;
  industry: string;
  companySize: string;
}

export interface LinkedInAnalytics {
  impressions: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

@Injectable()
export class LinkedInClientService {
  private readonly logger = new Logger(LinkedInClientService.name);
  private readonly apiUrl = 'https://api.linkedin.com/v2';

  /**
   * Get user's LinkedIn companies
   */
  async getUserCompanies(accessToken: string): Promise<LinkedInCompanyInfo[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/organizationAcls`, {
        params: {
          q: 'roleAssignee',
          role: 'ADMINISTRATOR'
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      const companyIds = response.data.elements.map((element: any) => element['organization~'].id);

      // Get detailed company information
      const companies = await Promise.all(
        companyIds.map(async (companyId: string) => {
          const companyResponse = await axios.get(`${this.apiUrl}/organizations/${companyId}`, {
            params: {
              projection: '(id,name,description,website,industry,companySize)'
            },
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0'
            }
          });

          return {
            id: companyResponse.data.id,
            name: companyResponse.data.name,
            description: companyResponse.data.description,
            website: companyResponse.data.website,
            industry: companyResponse.data.industry,
            companySize: companyResponse.data.companySize
          };
        })
      );

      return companies;
    } catch (error: any) {
      this.logger.error('Failed to get LinkedIn companies:', error);
      throw new Error(`Failed to get LinkedIn companies: ${error?.response?.data?.message || error?.message}`);
    }
  }

  /**
   * Publish a text post to LinkedIn company page
   */
  async publishCompanyPost(companyId: string, accessToken: string, content: LinkedInPostContent): Promise<LinkedInPostResult> {
    try {
      // Step 1: Create UGC (User Generated Content) post
      const ugcPost = {
        author: `urn:li:organization:${companyId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content.text
            },
            shareMediaCategory: content.media ? 'ARTICLE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': content.visibility
        }
      };

      // Add media if provided
      if (content.media) {
        (ugcPost as any).specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          description: {
            text: content.media.description
          },
          media: content.media.mediaUrl,
          title: {
            text: content.media.title
          }
        }];
      }

      const response = await axios.post(`${this.apiUrl}/ugcPosts`, ugcPost, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return {
        success: true,
        postId: response.data.id,
        url: `https://linkedin.com/feed/update/${response.data.id}`
      };
    } catch (error: any) {
      this.logger.error('Failed to publish LinkedIn post:', error);
      return {
        success: false,
        error: error?.response?.data?.message || error?.message
      };
    }
  }

  /**
   * Publish an image post to LinkedIn company page
   */
  async publishImagePost(companyId: string, accessToken: string, imageBuffer: Buffer, caption: string): Promise<LinkedInPostResult> {
    try {
      // Step 1: Register upload
      const registerResponse = await axios.post(`${this.apiUrl}/assets?action=registerUpload`, {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: `urn:li:organization:${companyId}`,
          serviceRelationships: [{
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent'
          }]
        }
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const assetId = registerResponse.data.value.asset;

      // Step 2: Upload image
      await axios.put(uploadUrl, imageBuffer, {
        headers: {
          'Content-Type': 'image/jpeg'
        }
      });

      // Step 3: Create UGC post with image
      const ugcPost = {
        author: `urn:li:organization:${companyId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: caption
            },
            shareMediaCategory: 'IMAGE',
            media: [{
              status: 'READY',
              description: {
                text: caption
              },
              media: assetId
            }]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const postResponse = await axios.post(`${this.apiUrl}/ugcPosts`, ugcPost, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return {
        success: true,
        postId: postResponse.data.id,
        url: `https://linkedin.com/feed/update/${postResponse.data.id}`
      };
    } catch (error: any) {
      this.logger.error('Failed to publish LinkedIn image post:', error);
      return {
        success: false,
        error: error?.response?.data?.message || error?.message
      };
    }
  }

  /**
   * Get post analytics
   */
  async getPostAnalytics(postId: string, accessToken: string): Promise<LinkedInAnalytics> {
    try {
      const response = await axios.get(`${this.apiUrl}/socialActions/${postId}/statistics`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      const stats = response.data;
      return {
        impressions: stats.numImpressions || 0,
        clicks: stats.numClicks || 0,
        likes: stats.numLikes || 0,
        comments: stats.numComments || 0,
        shares: stats.numShares || 0,
        views: stats.numViews || 0
      };
    } catch (error) {
      this.logger.error('Failed to get LinkedIn post analytics:', error);
      return {
        impressions: 0,
        clicks: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0
      };
    }
  }

  /**
   * Get company page analytics
   */
  async getCompanyAnalytics(companyId: string, accessToken: string, dateRange: { start: number; end: number }): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/organizationPageStatistics`, {
        params: {
          q: 'organization',
          organization: `urn:li:organization:${companyId}`,
          timeGranularity: 'DAY',
          startTime: dateRange.start,
          endTime: dateRange.end,
          metrics: 'FOLLOWERS_COUNT,IMPRESSIONS,CLICKS,ENGAGEMENT'
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return response.data.elements;
    } catch (error) {
      this.logger.error('Failed to get LinkedIn company analytics:', error);
      return [];
    }
  }

  /**
   * Get comments for a post
   */
  async getPostComments(postId: string, accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/socialActions/${postId}/comments`, {
        params: {
          count: 100
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return response.data.elements;
    } catch (error) {
      this.logger.error('Failed to get LinkedIn post comments:', error);
      return [];
    }
  }

  /**
   * Reply to a comment
   */
  async replyToComment(postId: string, commentId: string, accessToken: string, message: string): Promise<boolean> {
    try {
      await axios.post(`${this.apiUrl}/comments`, {
        actor: `urn:li:person:${commentId}`,
        object: `urn:li:ugcPost:${postId}`,
        message: {
          text: message
        }
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to reply to LinkedIn comment:', error);
      return false;
    }
  }

  /**
   * Validate access token
   */
  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.apiUrl}/people/~`, {
        params: {
          projection: '(id,firstName,lastName)'
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return !!response.data.id;
    } catch (error) {
      this.logger.error('LinkedIn access token validation failed:', error);
      return false;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number } | null> {
    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      this.logger.error('LinkedIn token refresh failed:', error);
      return null;
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/people/~`, {
        params: {
          projection: '(id,firstName,lastName,profilePicture(displayImage~:playableStreams))'
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get LinkedIn user profile:', error);
      return null;
    }
  }
}
