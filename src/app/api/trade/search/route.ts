import { NextRequest, NextResponse } from 'next/server';

const TRADE_API_BASE = 'https://www.pathofexile.com/api/trade2';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

let lastRequestTime = 0;

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

export async function POST(request: NextRequest) {
  try {
    await rateLimit();

    const body = await request.json();
    const { league = 'Standard', query } = body;

    // Search for items
    const searchResponse = await fetch(`${TRADE_API_BASE}/search/poe2/${league}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OAuth poe2toolkit/1.0 (contact: support@poe2toolkit.com)',
        'Accept': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Trade API search error:', errorText);
      return NextResponse.json(
        { error: 'Trade API search failed', details: errorText },
        { status: searchResponse.status }
      );
    }

    const searchData = await searchResponse.json();

    // Get top 10 results
    const itemIds = searchData.result?.slice(0, 10) || [];

    if (itemIds.length === 0) {
      return NextResponse.json({
        items: [],
        searchId: searchData.id,
        total: 0
      });
    }

    await rateLimit();

    // Fetch item details
    const fetchUrl = `${TRADE_API_BASE}/fetch/${itemIds.join(',')}?query=${searchData.id}`;
    const itemsResponse = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'OAuth poe2toolkit/1.0 (contact: support@poe2toolkit.com)',
        'Accept': 'application/json',
      },
    });

    if (!itemsResponse.ok) {
      const errorText = await itemsResponse.text();
      console.error('Trade API fetch error:', errorText);
      return NextResponse.json(
        { error: 'Trade API fetch failed', details: errorText },
        { status: itemsResponse.status }
      );
    }

    const itemsData = await itemsResponse.json();

    return NextResponse.json({
      items: itemsData.result || [],
      searchId: searchData.id,
      total: searchData.total || 0,
    });
  } catch (error) {
    console.error('Trade search error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const itemId = searchParams.get('itemId');
  const queryId = searchParams.get('queryId');

  if (!itemId || !queryId) {
    return NextResponse.json(
      { error: 'Missing itemId or queryId' },
      { status: 400 }
    );
  }

  try {
    await rateLimit();

    const fetchUrl = `${TRADE_API_BASE}/fetch/${itemId}?query=${queryId}`;
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'OAuth poe2toolkit/1.0 (contact: support@poe2toolkit.com)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Trade API fetch failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Item fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}