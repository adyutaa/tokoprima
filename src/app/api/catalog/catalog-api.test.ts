import { POST } from "./route";
import prisma from "../../../../lib/prisma";
import { generateProductEmbeddings } from "@/lib/embeddings";
import { Pinecone } from "@pinecone-database/pinecone";

jest.mock("../../../../lib/prisma", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@pinecone-database/pinecone", () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    Index: jest.fn(() => ({
      namespace: jest.fn(() => ({
        query: jest.fn(),
      })),
    })),
  })),
}));

jest.mock("../../../../lib/embeddings", () => ({
  generateProductEmbeddings: jest.fn(),
}));

jest.mock("../../../../lib/supabase", () => ({
  getImageUrl: jest.fn((key: string) => key),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGenerateProductEmbeddings = generateProductEmbeddings as jest.Mock;
const mockPinecone = new Pinecone({ apiKey: "test" });
const mockIndex = mockPinecone.Index("ecommerce-test");

mockIndex.namespace = jest.fn().mockReturnValue({
  query: jest.fn(),
});

describe("POST /api/catalog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns products for a valid search query", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        search: "test product",
      }),
    } as unknown as Request;

    // const mockProducts = [
    //   {
    //     id: 1,
    //     images: ["image1.jpg"],
    //     name: "Test Product 1",
    //     category: { name: "Category 1" },
    //     price: 100,
    //   },
    // ];

    // mockPrisma.product.findMany.mockResolvedValueOnce(mockProducts);
    // mockGenerateProductEmbeddings.mockResolvedValue([0.1, 0.2, 0.3]);
    // (mockIndex.namespace().query as jest.Mock).mockResolvedValue({
    //   matches: [{ id: "2", score: 0.9 }],
    // });

    // const vectorProducts = [
    //   {
    //     id: 2,
    //     images: ["image2.jpg"],
    //     name: "Vector Product 1",
    //     category: { name: "Category 2" },
    //     price: 150,
    //   },
    // ];

    // mockPrisma.product.findMany.mockResolvedValueOnce(vectorProducts);

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual([
      {
        id: 1,
        category_name: "Category 1",
        image_url: "image1.jpg",
        name: "Test Product 1",
        price: 100,
      },
      {
        id: 2,
        category_name: "Category 2",
        image_url: "image2.jpg",
        name: "Vector Product 1",
        price: 150,
      },
    ]);
  });

  it("handles errors gracefully", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        search: "",
      }),
    } as unknown as Request;

    // mockPrisma.product.findMany.mockRejectedValue(new Error("Database error"));

    const response = await POST(mockRequest);

    expect(response.status).toBe(500);
    const responseText = await response.text();
    expect(responseText).toBe("Internal server error");
  });
});
