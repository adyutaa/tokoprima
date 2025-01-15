/*
  Warnings:

  - You are about to drop the column `brand_id` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `location_id` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `Brand` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_location_id_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "brand_id",
DROP COLUMN "location_id";

-- DropTable
DROP TABLE "Brand";

-- DropTable
DROP TABLE "Location";
