import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default app settings
  const existingSettings = await prisma.appSettings.findFirst()
  if (!existingSettings) {
    await prisma.appSettings.create({
      data: {
        siteName: 'My App',
        timezone: 'UTC',
        theme: 'system',
        accentColor: '#000000',
        emailNotifications: true,
        pushNotifications: false,
      },
    })
    console.log('✅ Created default app settings')
  }

  console.log('🎉 Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
