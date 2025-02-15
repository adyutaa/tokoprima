/*
  Warnings:

  - You are about to drop the column `rating_count` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `categories` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_category_id_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "rating_count",
ADD COLUMN     "categories" VARCHAR(255) NOT NULL;

-- DropTable
DROP TABLE "Category";

-- DropEnum
DROP TYPE "ProductStock";
