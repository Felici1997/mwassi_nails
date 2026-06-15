import { NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';
import { SalonService } from '@/services/salon.service';

export async function GET() {
  try {
    const users = await UserService.getAllUsers();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, familyName, givenName } = await request.json();

    if (!email || !familyName || !givenName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await UserService.upsertUser({ email, givenName, familyName });
    
    // Use SalonService to ensure the default salon exists and get its ID
    const salon = await SalonService.getMwassiSalon();
    return NextResponse.json({ salonId: salon.id });
  } catch (error) {
    console.error('Error in API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


