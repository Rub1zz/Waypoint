// GET  -> returns all carpool posts
// POST -> creates a new carpool post
//
// Only runs for signed-in Netlify Identity users (already restricted to
// @uvm.edu by identity-validate.js). The Supabase service_role key is read
// from environment variables and never sent to the browser.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Sign in required' }) };
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Supabase env vars not configured' }) };
  }

  const supabaseHeaders = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'GET') {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/carpools?select=*&order=posted_at.desc`,
      { headers: supabaseHeaders }
    );
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Could not load carpools' }) };
    }
    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) };
    }

    if (!body.from || !body.to || !body.when) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const post = {
      id: 'carpool_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      from_location: String(body.from).slice(0, 60),
      to_location: String(body.to).slice(0, 60),
      when_text: String(body.when).slice(0, 60),
      seats: String(body.seats || '').slice(0, 10),
      notes: String(body.notes || '').slice(0, 300),
      posted_by: user.email,
      posted_at: Date.now()
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/carpools`, {
      method: 'POST',
      headers: { ...supabaseHeaders, Prefer: 'return=representation' },
      body: JSON.stringify(post)
    });
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Could not save carpool' }) };
    }
    const data = await res.json();
    return { statusCode: 201, body: JSON.stringify(data) };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};
