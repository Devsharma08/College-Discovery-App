import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import axios from 'axios';

const prisma = new PrismaClient();

const RENDER_API_URL = 'https://collegeapi.onrender.com';
const HIPOLABS_API_URL = 'http://universities.hipolabs.com/search?country=India';

async function seedColleges() {
  console.log('🚀 Starting Expanded Seeding (Render API + HipoLabs)...');

  try {
    // Clear existing data
    await prisma.cutoff.deleteMany();
    await prisma.collegeDetails.deleteMany();
    await prisma.userCollegePreferences.deleteMany();
    await prisma.college.deleteMany();

    // 1. Fetch from Render API (NIRF Data)
    const categories = [
      { path: 'engineering_colleges/nirf', label: 'Engineering' },
      { path: 'medical_colleges/nirf', label: 'Medical' },
      { path: 'management_colleges/nirf', label: 'Management' }
    ];

    for (const cat of categories) {
      console.log(`\n📦 Fetching NIRF ${cat.label} colleges...`);
      try {
        const response = await axios.get(`${RENDER_API_URL}/${cat.path}?limit=15`);
        for (const data of response.data) {
          if (!data.college_name) continue;
          await createCollegeEntry(data.college_name, data.city, data.state, cat.label);
        }
      } catch (e) { console.warn(`Failed ${cat.label}`); }
    }

    // 2. Fetch from HipoLabs (General Universities)
    console.log('\n🌐 Fetching Global Universities from HipoLabs...');
    try {
      const response = await axios.get(HIPOLABS_API_URL);
      const hipoData = response.data.slice(0, 30); // Take top 30
      for (const uni of hipoData) {
        await createCollegeEntry(
          uni.name,
          uni['state-province'] || 'India',
          uni.country,
          'University',
          uni.web_pages?.[0]
        );
      }
      console.log(`✅ Seeded ${hipoData.length} from HipoLabs`);
    } catch (e) { console.warn('Failed HipoLabs'); }

    console.log('\n✨ All Seeding Finished! ✨');
  } catch (error) {
    console.error('❌ Global Seeding Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createCollegeEntry(name: string, city: string, state: string, category: string, website?: string) {
  const existing = await prisma.college.findFirst({ where: { name } });
  if (existing) return;

  const mockFees = Math.floor(Math.random() * (600000 - 80000) + 80000);
  const mockRating = parseFloat((Math.random() * (5.0 - 4.0) + 4.0).toFixed(1));
  const mockImage = `https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800&sig=${Math.random()}`;

  await prisma.college.create({
    data: {
      name,
      location: `${city || 'India'}, ${state || ''}`,
      state: state || 'India',
      city: city || 'India',
      rating: mockRating,
      fees: mockFees,
      popularFor: category,
      imgUrl: mockImage,
      details: {
        create: {
          description: `${name} is a renowned institution. ${website ? 'Visit: ' + website : ''}`,
          imageUrl: mockImage,
          programs: 'Bachelors, Masters, PhD'
        }
      },
      cutoffs: {
        create: [
          { examName: 'Entrance', maxRank: Math.floor(Math.random() * 20000) + 500, category: 'General' }
        ]
      }
    }
  });
}

seedColleges();
