// Runs automatically before Netlify Identity lets someone sign up.
// If this returns anything other than 200/202/204, the signup (and the
// confirmation email Netlify would otherwise send) is blocked.
//
// Change ALLOWED_DOMAIN below if your school's email domain is different.

const ALLOWED_DOMAIN = '@uvm.edu';

exports.handler = async (event) => {
  let email = '';
  try {
    const payload = JSON.parse(event.body);
    email = ((payload && payload.user && payload.user.email) || '').toLowerCase();
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) };
  }

  if (!email.endsWith(ALLOWED_DOMAIN)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Only ${ALLOWED_DOMAIN} email addresses can sign up for this app.`
      })
    };
  }

  return { statusCode: 200, body: JSON.stringify({}) };
};
