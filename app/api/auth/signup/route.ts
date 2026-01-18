import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  console.log('Signup API called')
  try {
    console.log('Parsing request')
    const { email, password, name } = await request.json()
    console.log('Parsed:', { email, name })
    if (!email || !password || !name) {
      console.log('Missing fields')
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    console.log('Checking existing user')
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    if (existingUser) {
      console.log('User exists')
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }
    console.log('Hashing password')
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('Creating user')
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      }
    })
    console.log('User created:', user.id)
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}