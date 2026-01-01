import { TokenData } from './types';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export async function fetchTokenData(tokenId: string): Promise<TokenData | null> {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=true&sparkline=false`
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`CoinGecko API Error: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract correct github repos
    const repos = data.links?.repos_url?.github || [];
    const validRepos = repos.filter((url: string) => url && url.length > 0);

    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      current_price: data.market_data.current_price.usd,
      market_cap: data.market_data.market_cap.usd,
      total_volume: data.market_data.total_volume.usd,
      circulating_supply: data.market_data.circulating_supply,
      fully_diluted_valuation: data.market_data.fully_diluted_valuation.usd || null,
      price_change_percentage_24h: data.market_data.price_change_percentage_24h,
      github_repos: validRepos,
    };
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
}

export async function searchTokens(query: string) {
  try {
    const response = await fetch(`${COINGECKO_API_URL}/search?query=${query}`);
    const data = await response.json();
    return data.coins || [];
  } catch (error) {
    console.error('Error searching tokens:', error);
    return [];
  }
}
