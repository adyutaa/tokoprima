/*
  Warnings:

  - Added the required column `quantity` to the `OrderProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `OrderProduct` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderProduct" ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "subtotal" BIGINT NOT NULL;
