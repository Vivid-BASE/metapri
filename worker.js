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
                    reply_to: [email],
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
                console.error('Resend API (Notification) error:', errorData);
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Failed to send notification email',
                    debug: errorData
                }), {
                    status: 502,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            // Send auto-reply to the user
            let autoReplyStatus = 'skipped';
            const autoReplyResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: 'HMPA Official <onboarding@resend.dev>',
                    to: [email],
                    subject: 'Thank you for your inquiry',
                    html: `
            <p>${name} 様</p>
            <p>お問い合わせありがとうございます。</p>
            <p>以下の内容で受け付けいたしました。</p>
            <hr>
            <p><strong>件名:</strong> ${subject}</p>
            <p><strong>内容:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p>担当者より折り返しご連絡いたしますので、今しばらくお待ちください。</p>
            <br>
            <p>HEAVY METAL PRINCESS ACADEMY</p>
          `,
                }),
            });

            if (!autoReplyResponse.ok) {
                const errorData = await autoReplyResponse.text();
                console.warn('Resend API (Auto-reply) error:', errorData);
                autoReplyStatus = `failed: ${errorData}`;
            } else {
                autoReplyStatus = 'success';
            }

            // Return success response with debug info
            return new Response(JSON.stringify({
                success: true,
                autoReply: autoReplyStatus
            }), {
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
