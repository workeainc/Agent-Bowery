import axios from 'axios';

export class PlatformService {
  async ping(provider: string, accessToken: string) {
    switch (provider) {
      case 'meta':
        return this.metaMe(accessToken);
      case 'linkedin':
        return this.linkedinMe(accessToken);
      case 'google':
        return this.googleAccounts(accessToken);
      case 'youtube':
        return this.youtubeChannels(accessToken);
      default:
        return { ok: false, error: 'unsupported_provider' };
    }
  }

  async metaMe(token: string) {
    const url = 'https://graph.facebook.com/v19.0/me';
    const { data } = await axios.get(url, { params: { fields: 'id,name', access_token: token }, timeout: 10000 });
    return { ok: true, data };
  }

  async linkedinMe(token: string) {
    const url = 'https://api.linkedin.com/v2/me';
    const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 });
    return { ok: true, data };
  }

  async googleAccounts(token: string) {
    const url = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
    const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 });
    return { ok: true, data };
  }

  async youtubeChannels(token: string) {
    const url = 'https://www.googleapis.com/youtube/v3/channels';
    const { data } = await axios.get(url, { params: { part: 'id', mine: 'true' }, headers: { Authorization: `Bearer ${token}` }, timeout: 10000 });
    return { ok: true, data };
  }
}
