-- CreateTable
CREATE TABLE "Driver" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "program" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "licenseState" TEXT,
    "licenseExpiration" TIMESTAMP(3),
    "driverStatus" TEXT,
    "suspensionStartDate" TIMESTAMP(3),
    "suspensionEndDate" TIMESTAMP(3),
    "licenseStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "programVehicle" TEXT,
    "year" TEXT,
    "make" TEXT,
    "model" TEXT,
    "vinNumber" TEXT,
    "licensePlateNumber" TEXT,
    "gpsTracker" TEXT,
    "imeiNumber" TEXT,
    "serialNumber" TEXT,
    "driverId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Accident" (
    "id" SERIAL NOT NULL,
    "driverLicenseNumber" TEXT,
    "driverFirstName" TEXT,
    "driverLastName" TEXT,
    "programPartnerName" TEXT,
    "accidentDate" TIMESTAMP(3),
    "vinNumber" TEXT,
    "year" TEXT,
    "make" TEXT,
    "model" TEXT,
    "licensePlate" TEXT,
    "dcNumber" TEXT,
    "policeReportDate" TIMESTAMP(3),
    "policeReportTime" TEXT,
    "dateReportedToInsurance" TIMESTAMP(3),
    "staffMemberReporting" TEXT,
    "claimNumber" TEXT,
    "adjusterAssigned" TEXT,
    "documentation" TEXT,
    "driverId" INTEGER,
    "vehicleId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" SERIAL NOT NULL,
    "driverLicenseNumber" TEXT,
    "driverFirstName" TEXT,
    "driverLastName" TEXT,
    "programPartnerName" TEXT,
    "vinNumber" TEXT,
    "violationDate" TIMESTAMP(3),
    "citationNumber" TEXT,
    "citationDate" TIMESTAMP(3),
    "citationType" TEXT,
    "citationAmount" TEXT,
    "driverId" INTEGER,
    "vehicleId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" SERIAL NOT NULL,
    "ticketId" TEXT NOT NULL,
    "dateOfReport" TIMESTAMP(3),
    "issueWith" TEXT,
    "requestType" TEXT,
    "other" TEXT,
    "incidentLocation" TEXT,
    "details" TEXT,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "driverId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Driver_licenseNumber_key" ON "Driver"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vinNumber_key" ON "Vehicle"("vinNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_ticketId_key" ON "ServiceRequest"("ticketId");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accident" ADD CONSTRAINT "Accident_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accident" ADD CONSTRAINT "Accident_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
