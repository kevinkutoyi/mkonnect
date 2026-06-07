-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VISITOR', 'CLIENT', 'MASSEUSE', 'ADMIN');

-- CreateEnum
CREATE TYPE "TierName" AS ENUM ('REGULAR', 'VIP', 'PREMIUM', 'VVIP');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('INCOMPLETE', 'PENDING', 'APPROVED', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('UNVERIFIED', 'EMAIL_VERIFIED', 'PHONE_VERIFIED', 'ID_VERIFIED', 'FULLY_VERIFIED');

-- CreateEnum
CREATE TYPE "VerificationDocType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE', 'CERTIFICATE_OF_GOOD_CONDUCT', 'PROFESSIONAL_CERTIFICATE');

-- CreateEnum
CREATE TYPE "VerificationDocStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MPESA', 'CARD_VISA', 'CARD_MASTERCARD', 'BANK_TRANSFER', 'CASH');

-- CreateEnum
CREATE TYPE "ServiceDurationUnit" AS ENUM ('MINUTES', 'HOURS');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'FLAGGED', 'REMOVED');

-- CreateEnum
CREATE TYPE "AdminActionType" AS ENUM ('PROFILE_APPROVED', 'PROFILE_SUSPENDED', 'PROFILE_BANNED', 'PROFILE_REINSTATED', 'REVIEW_HIDDEN', 'REVIEW_REMOVED', 'PAYMENT_REFUNDED', 'BOOKING_CANCELLED', 'USER_SUSPENDED', 'USER_BANNED', 'USER_REINSTATED', 'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED', 'SERVICE_REMOVED', 'WARNING_ISSUED', 'NOTE_ADDED');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('MASSAGE_STYLE', 'SPECIALTY', 'SETTING', 'BODY_AREA');

-- CreateTable
CREATE TABLE "counties" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "countyId" INTEGER NOT NULL,
    "isCapital" BOOLEAN NOT NULL DEFAULT false,
    "isMajor" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "CategoryType" NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "phone" TEXT,
    "phoneVerified" TIMESTAMP(3),
    "password" TEXT,
    "name" TEXT NOT NULL,
    "gender" "Gender",
    "dateOfBirth" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'VISITOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedAt" TIMESTAMP(3),
    "bannedReason" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "referralCode" TEXT,
    "referredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "masseuse_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "tagline" VARCHAR(160),
    "cityId" INTEGER NOT NULL,
    "address" TEXT,
    "yearsExperience" INTEGER,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nationality" TEXT,
    "status" "ProfileStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'UNVERIFIED',
    "avatarUrl" TEXT,
    "coverPhotoUrl" TEXT,
    "availableMon" BOOLEAN NOT NULL DEFAULT false,
    "availableTue" BOOLEAN NOT NULL DEFAULT false,
    "availableWed" BOOLEAN NOT NULL DEFAULT false,
    "availableThu" BOOLEAN NOT NULL DEFAULT false,
    "availableFri" BOOLEAN NOT NULL DEFAULT false,
    "availableSat" BOOLEAN NOT NULL DEFAULT false,
    "availableSun" BOOLEAN NOT NULL DEFAULT false,
    "availableFrom" TEXT,
    "availableTo" TEXT,
    "mobileService" BOOLEAN NOT NULL DEFAULT false,
    "spaService" BOOLEAN NOT NULL DEFAULT false,
    "minPrice" DECIMAL(10,2),
    "maxPrice" DECIMAL(10,2),
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "responseTimeMin" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "profileScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "listingActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activeTierId" INTEGER,
    "activeTierName" "TierName",

    CONSTRAINT "masseuse_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "masseuse_profile_categories" (
    "profileId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "masseuse_profile_categories_pkey" PRIMARY KEY ("profileId","categoryId")
);

-- CreateTable
CREATE TABLE "profile_photos" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "altText" TEXT,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "isAvatar" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "sizeBytes" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "categoryId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "durationUnit" "ServiceDurationUnit" NOT NULL DEFAULT 'MINUTES',
    "price" DECIMAL(10,2) NOT NULL,
    "discountPrice" DECIMAL(10,2),
    "homeService" BOOLEAN NOT NULL DEFAULT false,
    "hotelVisit" BOOLEAN NOT NULL DEFAULT false,
    "studioService" BOOLEAN NOT NULL DEFAULT false,
    "studioLocation" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxClientsPerSlot" INTEGER NOT NULL DEFAULT 1,
    "requiresDeposit" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DECIMAL(10,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "bookingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_documents" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "docType" "VerificationDocType" NOT NULL,
    "status" "VerificationDocStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "clientPhone" TEXT,
    "location" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "depositPaid" DECIMAL(10,2),
    "isMobileVisit" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "merchantReference" TEXT NOT NULL,
    "orderTrackingId" TEXT,
    "confirmationCode" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "method" "PaymentMethod",
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "mpesaPhone" TEXT,
    "mpesaReceiptNumber" TEXT,
    "cardLast4" TEXT,
    "cardBrand" TEXT,
    "ipnId" TEXT,
    "pesapalEnv" TEXT NOT NULL DEFAULT 'sandbox',
    "failureReason" TEXT,
    "refundedAmount" DECIMAL(10,2),
    "refundedAt" TIMESTAMP(3),
    "refundReference" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "ratingOverall" INTEGER NOT NULL,
    "ratingCleanliness" INTEGER,
    "ratingTechnique" INTEGER,
    "ratingPunctuality" INTEGER,
    "ratingCommunication" INTEGER,
    "title" VARCHAR(200),
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'VISIBLE',
    "flaggedAt" TIMESTAMP(3),
    "flagReason" TEXT,
    "hiddenAt" TIMESTAMP(3),
    "hiddenBy" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_actions" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "actionType" "AdminActionType" NOT NULL,
    "targetProfileId" TEXT,
    "targetBookingId" TEXT,
    "targetPaymentId" TEXT,
    "targetReviewId" TEXT,
    "targetDocId" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_tiers" (
    "id" SERIAL NOT NULL,
    "name" "TierName" NOT NULL,
    "displayName" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "badge" TEXT,
    "color" TEXT,
    "description" TEXT,
    "perks" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "searchBoost" INTEGER NOT NULL DEFAULT 0,
    "featuredSlots" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_subscriptions" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "tierId" INTEGER NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "merchantReference" TEXT NOT NULL,
    "orderTrackingId" TEXT,
    "amountPaid" DECIMAL(10,2),
    "paidAt" TIMESTAMP(3),
    "grantedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "grantedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "counties_name_key" ON "counties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "counties_code_key" ON "counties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "counties_slug_key" ON "counties"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");

-- CreateIndex
CREATE INDEX "cities_countyId_idx" ON "cities"("countyId");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_countyId_key" ON "cities"("name", "countyId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_type_idx" ON "categories"("type");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "masseuse_profiles_userId_key" ON "masseuse_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "masseuse_profiles_slug_key" ON "masseuse_profiles"("slug");

-- CreateIndex
CREATE INDEX "masseuse_profiles_status_idx" ON "masseuse_profiles"("status");

-- CreateIndex
CREATE INDEX "masseuse_profiles_listingActive_idx" ON "masseuse_profiles"("listingActive");

-- CreateIndex
CREATE INDEX "masseuse_profiles_status_listingActive_idx" ON "masseuse_profiles"("status", "listingActive");

-- CreateIndex
CREATE INDEX "masseuse_profiles_cityId_idx" ON "masseuse_profiles"("cityId");

-- CreateIndex
CREATE INDEX "masseuse_profiles_avgRating_idx" ON "masseuse_profiles"("avgRating");

-- CreateIndex
CREATE INDEX "masseuse_profiles_profileScore_idx" ON "masseuse_profiles"("profileScore");

-- CreateIndex
CREATE INDEX "masseuse_profiles_isFeatured_idx" ON "masseuse_profiles"("isFeatured");

-- CreateIndex
CREATE INDEX "masseuse_profiles_verificationLevel_idx" ON "masseuse_profiles"("verificationLevel");

-- CreateIndex
CREATE INDEX "profile_photos_profileId_idx" ON "profile_photos"("profileId");

-- CreateIndex
CREATE INDEX "services_profileId_idx" ON "services"("profileId");

-- CreateIndex
CREATE INDEX "services_categoryId_idx" ON "services"("categoryId");

-- CreateIndex
CREATE INDEX "services_isActive_idx" ON "services"("isActive");

-- CreateIndex
CREATE INDEX "verification_documents_profileId_idx" ON "verification_documents"("profileId");

-- CreateIndex
CREATE INDEX "verification_documents_status_idx" ON "verification_documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingRef_key" ON "bookings"("bookingRef");

-- CreateIndex
CREATE INDEX "bookings_clientId_idx" ON "bookings"("clientId");

-- CreateIndex
CREATE INDEX "bookings_profileId_idx" ON "bookings"("profileId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_scheduledAt_idx" ON "bookings"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_bookingId_key" ON "payments"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_merchantReference_key" ON "payments"("merchantReference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderTrackingId_key" ON "payments"("orderTrackingId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_merchantReference_idx" ON "payments"("merchantReference");

-- CreateIndex
CREATE INDEX "payments_orderTrackingId_idx" ON "payments"("orderTrackingId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_bookingId_key" ON "reviews"("bookingId");

-- CreateIndex
CREATE INDEX "reviews_profileId_idx" ON "reviews"("profileId");

-- CreateIndex
CREATE INDEX "reviews_clientId_idx" ON "reviews"("clientId");

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- CreateIndex
CREATE INDEX "reviews_ratingOverall_idx" ON "reviews"("ratingOverall");

-- CreateIndex
CREATE INDEX "admin_actions_adminId_idx" ON "admin_actions"("adminId");

-- CreateIndex
CREATE INDEX "admin_actions_targetUserId_idx" ON "admin_actions"("targetUserId");

-- CreateIndex
CREATE INDEX "admin_actions_actionType_idx" ON "admin_actions"("actionType");

-- CreateIndex
CREATE INDEX "admin_actions_createdAt_idx" ON "admin_actions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "listing_tiers_name_key" ON "listing_tiers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "profile_subscriptions_merchantReference_key" ON "profile_subscriptions"("merchantReference");

-- CreateIndex
CREATE UNIQUE INDEX "profile_subscriptions_orderTrackingId_key" ON "profile_subscriptions"("orderTrackingId");

-- CreateIndex
CREATE INDEX "profile_subscriptions_profileId_idx" ON "profile_subscriptions"("profileId");

-- CreateIndex
CREATE INDEX "profile_subscriptions_status_idx" ON "profile_subscriptions"("status");

-- CreateIndex
CREATE INDEX "profile_subscriptions_expiresAt_idx" ON "profile_subscriptions"("expiresAt");

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "counties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masseuse_profiles" ADD CONSTRAINT "masseuse_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masseuse_profiles" ADD CONSTRAINT "masseuse_profiles_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masseuse_profile_categories" ADD CONSTRAINT "masseuse_profile_categories_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "masseuse_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masseuse_profile_categories" ADD CONSTRAINT "masseuse_profile_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "masseuse_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "masseuse_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "masseuse_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "masseuse_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "masseuse_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_subscriptions" ADD CONSTRAINT "profile_subscriptions_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "masseuse_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_subscriptions" ADD CONSTRAINT "profile_subscriptions_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "listing_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
