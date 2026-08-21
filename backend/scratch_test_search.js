async function testDuckDuckGo(q) {
  try {
    const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(`site:boardgamegeek.com/boardgame ${q}`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    console.log('DDG status:', res.status);
    const html = await res.text();
    const regex = /boardgamegeek\.com\/boardgame\/(\d+)/gi;
    const ids = [];
    let match;
    const seen = new Set();

    while ((match = regex.exec(html)) !== null) {
      const id = parseInt(match[1], 10);
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }

    console.log('Found BGG IDs for', q, '->', ids);
    return ids;
  } catch (err) {
    console.error('DDG error:', err);
    return [];
  }
}

async function run() {
  await testDuckDuckGo('princess jing');
  await testDuckDuckGo('harmonies board game');
  await testDuckDuckGo('sky team board game');
}

run();
