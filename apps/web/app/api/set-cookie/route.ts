import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { cookie } = await request.json();

    if (!cookie) {
      return NextResponse.json({ error: 'No cookie provided' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    // Parse the cookie string and set it in the response
    // Cookie format: "auth_session=value; Path=/; HttpOnly; SameSite=Lax"
    const cookieParts = cookie.split(';').map((part: string) => part.trim());
    const [nameValue] = cookieParts;
    const [name, value] = nameValue.split('=');

    // Extract cookie attributes
    const attributes: Record<string, string | boolean> = {};
    cookieParts.slice(1).forEach((part: string) => {
      const [key, val] = part.split('=');
      if (val) {
        attributes[key.toLowerCase()] = val;
      } else {
        attributes[key.toLowerCase()] = true;
      }
    });

    // Set the cookie
    response.cookies.set({
      name,
      value,
      path: attributes.path as string || '/',
      httpOnly: attributes.httponly === true,
      secure: attributes.secure === true,
      sameSite: (attributes.samesite as 'lax' | 'strict' | 'none') || 'lax',
      maxAge: attributes['max-age'] ? parseInt(attributes['max-age'] as string) : undefined,
    });

    return response;
  } catch (error) {
    console.error('Set cookie error:', error);
    return NextResponse.json({ error: 'Failed to set cookie' }, { status: 500 });
  }
}
