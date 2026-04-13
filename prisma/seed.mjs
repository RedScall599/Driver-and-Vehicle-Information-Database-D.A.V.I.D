import 'dotenv/config'
import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding D.A.V.I.D. database...\n')

  // ── Clear existing data (order matters for FK constraints) ──
  await prisma.document.deleteMany()
  await prisma.serviceRequest.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.accident.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.driver.deleteMany()
  await prisma.user.deleteMany()
  console.log('🗑  Cleared existing data\n')

  // ─────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────
  // Admin  → sees all records + user management panel
  // User   → sees all records, can create/edit/delete
  const adminHash = await bcrypt.hash('Admin@1234', 10)
  const userHash  = await bcrypt.hash('User@1234',  10)

  await prisma.user.createMany({
    data: [
      { email: 'admin@david.local',   name: 'System Administrator', passwordHash: adminHash, role: 'admin' },
      { email: 'sarah.jones@uac.org', name: 'Sarah Jones',          passwordHash: userHash,  role: 'user'  },
      { email: 'mike.brown@uac.org',  name: 'Mike Brown',           passwordHash: userHash,  role: 'user'  },
    ],
  })
  console.log('✅ Users created (admin + 2 regular users)')

  // Fetch IDs to associate records with owners
  const sarah = await prisma.user.findUnique({ where: { email: 'sarah.jones@uac.org' } })
  const mike  = await prisma.user.findUnique({ where: { email: 'mike.brown@uac.org'  } })

  // ─────────────────────────────────────────────
  // DRIVERS  (6 — mix of active, suspended, inactive)
  // ─────────────────────────────────────────────
  const d1 = await prisma.driver.create({ data: {
    firstName: 'Marcus',   lastName: 'Williams',
    program:   'Urban Transit Program',
    licenseNumber:     'PA-44821093',
    licenseState:      'PA',
    licenseExpiration: new Date('2027-08-14'),
    driverStatus:      'Active',
    licenseStatus:     'Valid',
    createdBy: sarah.id,
  }})

  const d2 = await prisma.driver.create({ data: {
    firstName: 'Tanya',    lastName: 'Rodriguez',
    program:   'Senior Mobility Program',
    licenseNumber:     'PA-37710582',
    licenseState:      'PA',
    licenseExpiration: new Date('2026-05-22'),
    driverStatus:      'Active',
    licenseStatus:     'Valid',
    createdBy: sarah.id,
  }})

  const d3 = await prisma.driver.create({ data: {
    firstName: 'James',    lastName: 'Carter',
    program:   'Urban Transit Program',
    licenseNumber:      'PA-29934471',
    licenseState:       'PA',
    licenseExpiration:  new Date('2025-12-01'),
    driverStatus:       'Suspended',
    suspensionStartDate: new Date('2025-07-01'),
    suspensionEndDate:   new Date('2026-07-01'),
    licenseStatus:       'Suspended',
    createdBy: mike.id,
  }})

  const d4 = await prisma.driver.create({ data: {
    firstName: 'Priya',    lastName: 'Patel',
    program:   'Youth Workforce Program',
    licenseNumber:     'NJ-55210987',
    licenseState:      'NJ',
    licenseExpiration: new Date('2028-03-19'),
    driverStatus:      'Active',
    licenseStatus:     'Valid',
    createdBy: mike.id,
  }})

  const d5 = await prisma.driver.create({ data: {
    firstName: 'Derek',    lastName: 'Johnson',
    program:   'Senior Mobility Program',
    licenseNumber:     'PA-61102234',
    licenseState:      'PA',
    licenseExpiration: new Date('2024-11-30'),
    driverStatus:      'Inactive',
    licenseStatus:     'Expired',
    createdBy: mike.id,
  }})

  const d6 = await prisma.driver.create({ data: {
    firstName: 'Alicia',   lastName: 'Thompson',
    program:   'Re-Entry Support Program',
    licenseNumber:     'PA-78845103',
    licenseState:      'PA',
    licenseExpiration: new Date('2027-01-15'),
    driverStatus:      'Active',
    licenseStatus:     'Valid',
    createdBy: mike.id,
  }})

  console.log('✅ Drivers created (6 drivers across 4 programs)')

  // ─────────────────────────────────────────────
  // VEHICLES  (5 program vans — each linked to a driver)
  // ─────────────────────────────────────────────
  const v1 = await prisma.vehicle.create({ data: {
    programVehicle:     'UAC-001',
    year: '2021', make: 'Ford',      model: 'Transit',
    vinNumber:          '1FTBW2CM2MKA12345',
    licensePlateNumber: 'TRN001',
    gpsTracker:         'GPS-UAC-001',
    imeiNumber:         '352099001761481',
    serialNumber:       'FT21-001',
    driverId: d1.id,
    createdBy: sarah.id,
  }})

  const v2 = await prisma.vehicle.create({ data: {
    programVehicle:     'UAC-002',
    year: '2020', make: 'Chevrolet', model: 'Express',
    vinNumber:          '1GCWGAFP8L1234567',
    licensePlateNumber: 'TRN002',
    gpsTracker:         'GPS-UAC-002',
    imeiNumber:         '352099001761482',
    serialNumber:       'CE20-002',
    driverId: d2.id,
    createdBy: sarah.id,
  }})

  const v3 = await prisma.vehicle.create({ data: {
    programVehicle:     'UAC-003',
    year: '2019', make: 'Toyota',    model: 'Sienna',
    vinNumber:          '5TDYZ3DC8KS987654',
    licensePlateNumber: 'TRN003',
    gpsTracker:         'GPS-UAC-003',
    imeiNumber:         '352099001761483',
    serialNumber:       'TS19-003',
    driverId: d3.id,
    createdBy: mike.id,
  }})

  const v4 = await prisma.vehicle.create({ data: {
    programVehicle:     'UAC-004',
    year: '2022', make: 'Honda',     model: 'Odyssey',
    vinNumber:          '5FNRL6H73NB012345',
    licensePlateNumber: 'TRN004',
    gpsTracker:         'GPS-UAC-004',
    imeiNumber:         '352099001761484',
    serialNumber:       'HO22-004',
    driverId: d4.id,
    createdBy: mike.id,
  }})

  const v5 = await prisma.vehicle.create({ data: {
    programVehicle:     'UAC-005',
    year: '2018', make: 'Dodge',     model: 'Grand Caravan',
    vinNumber:          '2C4RDGCG8JR123456',
    licensePlateNumber: 'TRN005',
    gpsTracker:         'GPS-UAC-005',
    imeiNumber:         '352099001761485',
    serialNumber:       'DGC18-005',
    driverId: d5.id,
    createdBy: mike.id,
  }})

  console.log('✅ Vehicles created (5 program vehicles)')

  // ─────────────────────────────────────────────
  // ACCIDENTS  (3 incidents)
  // ─────────────────────────────────────────────
  await prisma.accident.create({ data: {
    driverLicenseNumber: d1.licenseNumber,
    driverFirstName:     d1.firstName,
    driverLastName:      d1.lastName,
    programPartnerName:  'Urban Transit Program',
    accidentDate:        new Date('2025-03-15'),
    vinNumber:           v1.vinNumber,
    year:                v1.year,
    make:                v1.make,
    model:               v1.model,
    licensePlate:        v1.licensePlateNumber,
    dcNumber:            'DC-2025-03-1142',
    policeReportDate:    new Date('2025-03-15'),
    policeReportTime:    '14:30',
    dateReportedToInsurance: new Date('2025-03-17'),
    staffMemberReporting: 'Sarah Jones',
    claimNumber:          'CLM-2025-00387',
    adjusterAssigned:     'Robert Haines',
    documentation:        'Minor rear-end collision on Broad Street. Rear bumper damage only. No injuries reported. Police report on file.',
    driverId:   d1.id,
    vehicleId:  v1.id,
    createdBy:  sarah.id,
  }})

  await prisma.accident.create({ data: {
    driverLicenseNumber: d3.licenseNumber,
    driverFirstName:     d3.firstName,
    driverLastName:      d3.lastName,
    programPartnerName:  'Urban Transit Program',
    accidentDate:        new Date('2025-01-08'),
    vinNumber:           v3.vinNumber,
    year:                v3.year,
    make:                v3.make,
    model:               v3.model,
    licensePlate:        v3.licensePlateNumber,
    dcNumber:            'DC-2025-01-0231',
    policeReportDate:    new Date('2025-01-08'),
    policeReportTime:    '09:15',
    dateReportedToInsurance: new Date('2025-01-10'),
    staffMemberReporting: 'Mike Brown',
    claimNumber:          'CLM-2025-00041',
    adjusterAssigned:     'Linda Marsh',
    documentation:        'Parking lot collision at client site. Left rear panel damage — estimated $2,400 repair. Vehicle out of service for 3 weeks.',
    driverId:   d3.id,
    vehicleId:  v3.id,
    createdBy:  mike.id,
  }})

  await prisma.accident.create({ data: {
    driverLicenseNumber: d6.licenseNumber,
    driverFirstName:     d6.firstName,
    driverLastName:      d6.lastName,
    programPartnerName:  'Re-Entry Support Program',
    accidentDate:        new Date('2025-11-20'),
    vinNumber:           null,
    year:                null,
    make:                null,
    model:               null,
    licensePlate:        null,
    dcNumber:            'DC-2025-11-4420',
    policeReportDate:    new Date('2025-11-20'),
    policeReportTime:    '17:45',
    dateReportedToInsurance: new Date('2025-11-22'),
    staffMemberReporting: 'Sarah Jones',
    claimNumber:          'CLM-2025-01102',
    adjusterAssigned:     'Robert Haines',
    documentation:        'Minor fender bender on I-95 southbound. No injuries. Vehicle driveable. Claim opened as precaution.',
    driverId:  d6.id,
    vehicleId: null,
    createdBy: mike.id,
  }})

  console.log('✅ Accidents created (3 incidents)')

  // ─────────────────────────────────────────────
  // TICKETS  (5 traffic / parking violations)
  // ─────────────────────────────────────────────
  await prisma.ticket.create({ data: {
    driverLicenseNumber: d1.licenseNumber,
    driverFirstName:     d1.firstName,
    driverLastName:      d1.lastName,
    programPartnerName:  'Urban Transit Program',
    vinNumber:           v1.vinNumber,
    violationDate:       new Date('2025-02-10'),
    citationNumber:      'PHL-2025-88441',
    citationDate:        new Date('2025-02-10'),
    citationType:        'Speeding',
    citationAmount:      '150.00',
    driverId: d1.id, vehicleId: v1.id,
    createdBy: sarah.id,
  }})

  await prisma.ticket.create({ data: {
    driverLicenseNumber: d2.licenseNumber,
    driverFirstName:     d2.firstName,
    driverLastName:      d2.lastName,
    programPartnerName:  'Senior Mobility Program',
    vinNumber:           v2.vinNumber,
    violationDate:       new Date('2025-04-22'),
    citationNumber:      'PHL-2025-91782',
    citationDate:        new Date('2025-04-22'),
    citationType:        'Parking Violation',
    citationAmount:      '65.00',
    driverId: d2.id, vehicleId: v2.id,
    createdBy: sarah.id,
  }})

  await prisma.ticket.create({ data: {
    driverLicenseNumber: d3.licenseNumber,
    driverFirstName:     d3.firstName,
    driverLastName:      d3.lastName,
    programPartnerName:  'Urban Transit Program',
    vinNumber:           v3.vinNumber,
    violationDate:       new Date('2025-06-30'),
    citationNumber:      'PHL-2025-99013',
    citationDate:        new Date('2025-06-30'),
    citationType:        'Running Red Light',
    citationAmount:      '300.00',
    driverId: d3.id, vehicleId: v3.id,
    createdBy: mike.id,
  }})

  await prisma.ticket.create({ data: {
    driverLicenseNumber: d5.licenseNumber,
    driverFirstName:     d5.firstName,
    driverLastName:      d5.lastName,
    programPartnerName:  'Senior Mobility Program',
    vinNumber:           v5.vinNumber,
    violationDate:       new Date('2025-09-15'),
    citationNumber:      'PHL-2025-10345',
    citationDate:        new Date('2025-09-15'),
    citationType:        'Expired Registration',
    citationAmount:      '100.00',
    driverId: d5.id, vehicleId: v5.id,
    createdBy: mike.id,
  }})

  await prisma.ticket.create({ data: {
    driverLicenseNumber: d4.licenseNumber,
    driverFirstName:     d4.firstName,
    driverLastName:      d4.lastName,
    programPartnerName:  'Youth Workforce Program',
    vinNumber:           v4.vinNumber,
    violationDate:       new Date('2025-12-03'),
    citationNumber:      'NWK-2025-55281',
    citationDate:        new Date('2025-12-03'),
    citationType:        'Failure to Yield',
    citationAmount:      '200.00',
    driverId: d4.id, vehicleId: v4.id,
    createdBy: mike.id,
  }})

  console.log('✅ Tickets created (5 violations)')

  // ─────────────────────────────────────────────
  // SERVICE REQUESTS  (4 maintenance / repair tickets)
  // ─────────────────────────────────────────────
  await prisma.serviceRequest.create({ data: {
    ticketId:        'SR-2026-001',
    dateOfReport:    new Date('2026-01-12'),
    issueWith:       'UAC-001 – Ford Transit (2021)',
    requestType:     'Routine Maintenance',
    incidentLocation: '1301 N Broad St, Philadelphia, PA',
    details:          'Scheduled oil change and tire rotation. Vehicle at 35,000 miles — last serviced at 25,000 miles. Also check air filter.',
    createdBy: sarah.id,
  }})

  await prisma.serviceRequest.create({ data: {
    ticketId:        'SR-2026-002',
    dateOfReport:    new Date('2026-01-28'),
    issueWith:       'UAC-002 – Chevrolet Express (2020)',
    requestType:     'Mechanical Repair',
    incidentLocation: 'Route 30, Drexel Hill, PA',
    details:          'Driver reported grinding noise from front-left wheel during morning route. Possible brake pad wear or rotor damage. Vehicle pulled from service pending full brake inspection.',
    createdBy: mike.id,
  }})

  await prisma.serviceRequest.create({ data: {
    ticketId:        'SR-2026-003',
    dateOfReport:    new Date('2026-02-05'),
    issueWith:       'UAC-003 – Toyota Sienna (2019)',
    requestType:     'GPS / Technology Issue',
    incidentLocation: '1301 N Broad St, Philadelphia, PA',
    details:          'GPS tracker GPS-UAC-003 stopped reporting location as of 2026-01-30. IMEI: 352099001761483. Check physical connection and push firmware update via fleet portal.',
    createdBy: mike.id,
  }})

  await prisma.serviceRequest.create({ data: {
    ticketId:        'SR-2026-004',
    dateOfReport:    new Date('2026-03-10'),
    issueWith:       'UAC-005 – Dodge Grand Caravan (2018)',
    requestType:     'Routine Maintenance',
    incidentLocation: '1301 N Broad St, Philadelphia, PA',
    details:          'Annual state inspection overdue. Registration expired November 2024. Vehicle currently inactive and unassigned. Schedule inspection before return to service.',
    createdBy: mike.id,
  }})

  console.log('✅ Service requests created (4 maintenance tickets)')

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  console.log('\n🎉 Seed complete!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  LOGIN CREDENTIALS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Role     Email                      Password')
  console.log('  ───────  ─────────────────────────  ──────────')
  console.log('  Admin    admin@david.local           Admin@1234')
  console.log('  User     sarah.jones@uac.org         User@1234')
  console.log('  User     mike.brown@uac.org          User@1234')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('  DATA SEEDED')
  console.log('  • 6 drivers  (4 Active, 1 Suspended, 1 Inactive)')
  console.log('  • 5 vehicles (program vans UAC-001 → UAC-005)')
  console.log('  • 3 accidents')
  console.log('  • 5 tickets')
  console.log('  • 4 service requests')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
