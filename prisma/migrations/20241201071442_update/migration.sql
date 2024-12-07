-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "rating_count" INTEGER;

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "review_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_name" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "product_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Review_review_id_key" ON "Review"("review_id");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
