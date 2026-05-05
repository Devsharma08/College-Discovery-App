import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

const CITIES_AND_STATES = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'New Delhi', state: 'Delhi' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Mysore', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Coimbatore', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Noida', state: 'Uttar Pradesh' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Chandigarh', state: 'Punjab' },
  { city: 'Bhubaneswar', state: 'Odisha' },
  { city: 'Guwahati', state: 'Assam' },
  { city: 'Patna', state: 'Bihar' }
];

const PREFIXES = ['National Institute of', 'Indian Institute of', 'Global', 'Presidency', 'Royal', 'St. Xavier\'s', 'Sri Venkateswara', 'Amity', 'SRM', 'VIT', 'Birla', 'Delhi', 'Mumbai', 'Bangalore', 'Advanced', 'Modern', 'Symbiosis', 'Manipal', 'Apex', 'Pinnacle'];
const SUFFIXES = ['Technology', 'Science', 'Management', 'Medical Sciences', 'University', 'College of Engineering', 'Institute of Advanced Studies', 'Business School', 'Design Institute', 'Law College', 'Arts & Commerce College', 'Academy of Research'];
const COURSES = [
  { name: 'Computer Science and Engineering', level: 'B.Tech', duration: 4 },
  { name: 'Mechanical Engineering', level: 'B.Tech', duration: 4 },
  { name: 'Electrical Engineering', level: 'B.Tech', duration: 4 },
  { name: 'Civil Engineering', level: 'B.Tech', duration: 4 },
  { name: 'Information Technology', level: 'B.Tech', duration: 4 },
  { name: 'Business Administration', level: 'MBA', duration: 2 },
  { name: 'Marketing Management', level: 'MBA', duration: 2 },
  { name: 'Finance', level: 'MBA', duration: 2 },
  { name: 'Medicine and Surgery', level: 'MBBS', duration: 5 },
  { name: 'Dental Surgery', level: 'BDS', duration: 5 },
  { name: 'Architecture', level: 'B.Arch', duration: 5 },
  { name: 'Law', level: 'LLB', duration: 3 },
  { name: 'Commerce', level: 'B.Com', duration: 3 },
  { name: 'Physics', level: 'B.Sc', duration: 3 },
  { name: 'Mathematics', level: 'B.Sc', duration: 3 },
];

const FACILITIES = [
  'Central Library', 'Boys Hostel', 'Girls Hostel', 'Sports Complex', 'Cafeteria', 
  'Wi-Fi Campus', 'Auditorium', 'Medical Facility', 'A/C Classrooms', 'Labs', 
  'Gym', 'Swimming Pool', 'Convenience Store', 'Bank / ATM', 'Transport Facility'
];

const EXAMS = ['JEE Mains', 'JEE Advanced', 'NEET', 'CAT', 'GATE', 'CLAT', 'BITSAT', 'CUET', 'MHT CET', 'KCET'];
const TOP_RECRUITERS = [
  'Google, Microsoft, Amazon, Apple', 'TCS, Infosys, Wipro, Cognizant', 
  'Deloitte, KPMG, PwC, EY', 'L&T, Tata Motors, Mahindra, Reliance',
  'Apollo Hospitals, Fortis, Max Healthcare', 'HDFC Bank, ICICI Bank, Axis Bank',
  'Flipkart, Paytm, Zomato, Swiggy', 'IBM, Accenture, Capgemini'
];
const TYPES = ['Government', 'Private', 'Deemed', 'Autonomous'];

const IMAGES = [
  'https://images.unsplash.com/photo-1562774053-701939374585',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef',
  'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1',
  'https://images.unsplash.com/photo-1592280771190-3e2e4d571952',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765',
  'https://images.unsplash.com/photo-1606761568499-6d2451b23c66',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846'
];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomEl = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

async function main() {
  console.log('Clearing existing data...');
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.review.deleteMany();
  await prisma.placementStat.deleteMany();
  await prisma.course.deleteMany();
  await prisma.collegeFacility.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.event.deleteMany();
  await prisma.cutoff.deleteMany();
  await prisma.collegeDetails.deleteMany();
  await prisma.userCollegePreferences.deleteMany();
  await prisma.userAcademicRecord.deleteMany();
  await prisma.college.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Users...');
  const hashedPassword = "$2a$10$wT0lYlI0g2f9kK6vN4O1.eeu8H7F09D7dCq0a2dC1tTq2tP2/lJjO"; // Hash of 'password123'
  const adminUser = await prisma.user.create({
    data: { email: 'admin@campusfinder.com', username: 'AdminUser', password: hashedPassword, role: 'ADMIN' }
  });
  const studentUser = await prisma.user.create({
    data: { email: 'student@example.com', username: 'Rahul Student', password: hashedPassword, role: 'USER' }
  });

  console.log('Seeding Facilities...');
  const facilityRecords = await Promise.all(
    FACILITIES.map(name => prisma.facility.create({ data: { name } }))
  );

  console.log('Seeding 500 Colleges (this may take a minute)...');
  
  const totalColleges = 500;
  let createdCount = 0;

  for (let i = 0; i < totalColleges; i++) {
    const loc = randomEl(CITIES_AND_STATES);
    const prefix = randomEl(PREFIXES);
    const suffix = randomEl(SUFFIXES);
    const collegeName = `${prefix} ${suffix} ${loc.city} ${i > 0 ? `(${i})` : ''}`; // Ensuring uniqueness
    const rating = randomFloat(3.5, 5.0);
    const fees = randomInt(50000, 800000);
    const popularFor = randomEl(['Engineering', 'Medical', 'Management', 'Arts & Science', 'Law', 'Architecture']);
    const imgUrl = `${randomEl(IMAGES)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80`;

    // Select random courses (3 to 8 courses per college)
    const collegeCourses = [];
    const numCourses = randomInt(3, 8);
    const shuffledCourses = [...COURSES].sort(() => 0.5 - Math.random());
    for (let c = 0; c < numCourses; c++) {
      collegeCourses.push({
        name: shuffledCourses[c].name,
        level: shuffledCourses[c].level,
        durationInYears: shuffledCourses[c].duration,
        tuitionFee: randomInt(fees - 20000, fees + 50000),
        seatsAvailable: randomInt(40, 240)
      });
    }

    // Generate cutoffs
    const cutoffs = [];
    const numCutoffs = randomInt(1, 3);
    for (let c = 0; c < numCutoffs; c++) {
      cutoffs.push({
        examName: randomEl(EXAMS),
        maxRank: randomInt(100, 50000),
        category: randomEl(['General', 'OBC', 'SC/ST'])
      });
    }

    // Generate placements
    const avgPackage = randomInt(300000, 1500000);
    const highestPackage = randomInt(avgPackage * 2, avgPackage * 10);
    const placements = [
      { year: 2023, highestPackage, averagePackage: avgPackage, placementPercentage: randomInt(60, 100), topRecruiters: randomEl(TOP_RECRUITERS).split(', ') },
      { year: 2022, highestPackage: highestPackage * 0.9, averagePackage: avgPackage * 0.9, placementPercentage: randomInt(60, 100), topRecruiters: randomEl(TOP_RECRUITERS).split(', ') }
    ];

    // Select facilities
    const numFacilities = randomInt(5, 12);
    const selectedFacilities = [...facilityRecords].sort(() => 0.5 - Math.random()).slice(0, numFacilities);

    // Build the mega transaction payload for this college
    await prisma.college.create({
      data: {
        name: collegeName,
        location: `Plot ${randomInt(1, 100)}, Knowledge Park, ${loc.city}, ${loc.state} ${randomInt(100000, 999999)}`,
        state: loc.state,
        city: loc.city,
        rating,
        fees,
        popularFor,
        type: randomEl(TYPES),
        imgUrl,
        details: {
          create: {
            description: `Established in 200${randomInt(0, 9)}, ${collegeName} is a premier institution located in ${loc.city}. It offers world-class education and has a sprawling campus equipped with modern amenities.`,
            programs: collegeCourses.map(c => c.level).join(', '),
            imageUrl: imgUrl
          }
        },
        courses: { create: collegeCourses },
        cutoffs: { create: cutoffs },
        placementStats: { create: placements },
        reviews: {
          create: Math.random() > 0.5 ? [{
            userId: studentUser.id,
            rating: randomInt(3, 5),
            comment: randomEl([
              'Great campus life and faculty.',
              'Placements are okay, but infrastructure is top notch.',
              'Best college in the city for this course!',
              'Strict curriculum but it pays off during placements.',
              'Amazing experience, made great friends.'
            ])
          }] : []
        },
        facilities: {
          create: selectedFacilities.map(f => ({
            facilityId: f.id
          }))
        }
      }
    });

    createdCount++;
    if (createdCount % 50 === 0) {
      console.log(`Created ${createdCount} / ${totalColleges} colleges...`);
    }
  }

  console.log(`✅ Successfully seeded 1 Admin, 1 Student, ${FACILITIES.length} Facilities, and ${totalColleges} Colleges with detailed mock data!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
