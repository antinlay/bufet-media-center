import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'demo@bufet.com',
      password: hashedPassword,
      phone: '+1234567890',
    },
  });

  const playlist = await prisma.playlist.create({
    data: {
      userId: user.id,
      name: 'Demo Playlist',
    },
  });

  const items = [
    {
      playlistId: playlist.id,
      type: 'IMAGE' as const,
      url: 'https://picsum.photos/1920/1080?random=1',
      durationSeconds: 10,
      order: 0,
    },
    {
      playlistId: playlist.id,
      type: 'IMAGE' as const,
      url: 'https://picsum.photos/1920/1080?random=2',
      durationSeconds: 10,
      order: 1,
    },
    {
      playlistId: playlist.id,
      type: 'IMAGE' as const,
      url: 'https://picsum.photos/1920/1080?random=3',
      durationSeconds: 10,
      order: 2,
    },
  ];

  for (const item of items) {
    await prisma.playlistItem.create({
      data: item,
    });
  }

  console.log('Seed data created:');
  console.log('User: demo@bufet.com / password123');
  console.log('Playlist:', playlist.name);
  console.log('Playlist items:', items.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });