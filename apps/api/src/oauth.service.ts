import axios from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OAuthService {
  async exchangeMeta(code: string, redirectUri: string) {
    const clientId = process.env.META_APP_ID || '';
    const clientSecret = process.env.META_APP_SECRET || '';
    const url = 'https://graph.facebook.com/v19.0/oauth/access_token';
    const params = { client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code };
    const { data } = await axios.get(url, { params });
    return data; // { access_token, token_type, expires_in }
  }

  async exchangeLinkedIn(code: string, redirectUri: string, codeVerifier?: string) {
    const clientId = process.env.LINKEDIN_CLIENT_ID || '';
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
    const url = 'https://www.linkedin.com/oauth/v2/accessToken';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });
    if (codeVerifier) params.append('code_verifier', codeVerifier);
    const { data } = await axios.post(url, params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    return data; // { access_token, expires_in }
  }

  async exchangeGoogle(code: string, redirectUri: string, codeVerifier?: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET || '';
    const url = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });
    if (codeVerifier) params.append('code_verifier', codeVerifier);
    const { data } = await axios.post(url, params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    return data; // { access_token, refresh_token, expires_in, token_type, scope }
  }
}
