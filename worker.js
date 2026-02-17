/**
 * Cloudflare Worker for Contact Form Submission
 * Handles form submissions and sends email notifications via Resend API
 */

export default {
    async fetch(request, env) {
        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        // Only accept POST requests
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        try {
            // Parse form data
            const formData = await request.formData();
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');

            // Validate required fields
            if (!name || !email || !subject || !message) {
                return new Response(JSON.stringify({ error: 'All fields are required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Send email via Resend API
            const resendResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: 'Contact Form <onboarding@resend.dev>',
                    to: [env.NOTIFICATION_EMAIL],
                    subject: `[Contact Form] ${subject}`,
                    html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          `,
                }),
            });

            if (!resendResponse.ok) {
                const errorData = await resendResponse.text();
                console.error('Resend API error:', errorData);
                throw new Error('Failed to send email');
            }

            // Return success response
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });

        } catch (error) {
            console.error('Error processing form submission:', error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }
    },
};
