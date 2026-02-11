/**
 * Unit tests for enrichment clients.
 * All HTTP calls are mocked — no real API requests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SamGovClient } from "../../src/enrichment/sam-gov.js";
import { SubAwardsClient } from "../../src/enrichment/subawards.js";
import { OpenSanctionsClient } from "../../src/enrichment/open-sanctions.js";

// ─── Logger mock ────────────────────────────────────────────────────────────

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  fatal: vi.fn(),
  trace: vi.fn(),
  child: vi.fn().mockReturnThis(),
  level: "info",
} as any;

// ─── Fetch mock helper ──────────────────────────────────────────────────────

function mockFetchResponse(data: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

// ─── SAM.gov Client Tests ───────────────────────────────────────────────────

describe("SamGovClient", () => {
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalApiKey = process.env.SAM_GOV_API_KEY;
  });

  afterEach(() => {
    if (originalApiKey !== undefined) {
      process.env.SAM_GOV_API_KEY = originalApiKey;
    } else {
      delete process.env.SAM_GOV_API_KEY;
    }
    vi.restoreAllMocks();
  });

  const clientOptions = {
    baseUrl: "https://api.sam.gov/entity-information/v3/entities",
    exclusionsUrl: "https://api.sam.gov/entity-information/v4/exclusions",
    requestsPerSecond: 10,
    maxRetries: 0,
    cacheDirectory: "/tmp/test-cache-sam",
    cacheEnabled: false,
    logger: mockLogger,
  };

  it("returns null when API key is not set (entity search)", async () => {
    delete process.env.SAM_GOV_API_KEY;
    const client = new SamGovClient(clientOptions);
    const result = await client.searchEntity("ACME Corp");

    expect(result).toBeNull();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it("returns null when API key is not set (UEI lookup)", async () => {
    delete process.env.SAM_GOV_API_KEY;
    const client = new SamGovClient(clientOptions);
    const result = await client.lookupByUei("ABC123DEF456");

    expect(result).toBeNull();
  });

  it("returns null when API key is not set (exclusion check)", async () => {
    delete process.env.SAM_GOV_API_KEY;
    const client = new SamGovClient(clientOptions);
    const result = await client.checkExclusions("ACME Corp");

    expect(result).toBeNull();
  });

  it("returns entity data on successful search", async () => {
    process.env.SAM_GOV_API_KEY = "test-key";
    const samResponse = {
      totalRecords: 1,
      entityData: [
        {
          ueiSAM: "ABC123DEF456",
          legalBusinessName: "ACME CORP",
          entityTypeDesc: "Business or Organization",
          registrationStatus: "Active",
          exclusionStatusFlag: "N",
          physicalAddress: {
            city: "Washington",
            stateOrProvinceCode: "DC",
            countryCode: "USA",
          },
          businessTypes: ["2X", "27"],
          naicsCodeList: [{ naicsCode: "541511" }],
        },
      ],
    };

    const fetchMock = mockFetchResponse(samResponse);
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

    const client = new SamGovClient(clientOptions);
    const result = await client.searchEntity("ACME CORP");

    expect(result).not.toBeNull();
    expect(result!.data).not.toBeNull();
    expect(result!.data!.ueiSAM).toBe("ABC123DEF456");
    expect(result!.data!.legalBusinessName).toBe("ACME CORP");
    expect(result!.data!.exclusionStatusFlag).toBe(false);
    expect(result!.data!.physicalAddress?.city).toBe("Washington");
    expect(result!.data!.naicsCodes).toEqual(["541511"]);
    expect(result!.provenance.source).toBe("sam_gov");
    expect(result!.provenance.cacheHit).toBe(false);
    expect(result!.provenance.apiKeyUsed).toBe(true);
  });

  it("returns null data when no entity found", async () => {
    process.env.SAM_GOV_API_KEY = "test-key";
    const fetchMock = mockFetchResponse({ totalRecords: 0, entityData: [] });
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

    const client = new SamGovClient(clientOptions);
    const result = await client.searchEntity("Nonexistent Corp");

    expect(result).not.toBeNull();
    expect(result!.data).toBeNull();
  });

  it("returns exclusion records", async () => {
    process.env.SAM_GOV_API_KEY = "test-key";
    const exclusionResponse = {
      totalRecords: 1,
      excludedEntityList: [
        {
          classificationType: "Individual",
          exclusionType: "Ineligible",
          excludingAgencyCode: "DOD",
          activateDate: "2020-01-15",
          terminationDate: "2025-01-15",
          name: "John Doe",
          description: "Test exclusion",
        },
      ],
    };

    const fetchMock = mockFetchResponse(exclusionResponse);
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

    const client = new SamGovClient(clientOptions);
    const result = await client.checkExclusions("John Doe");

    expect(result).not.toBeNull();
    expect(result!.data).toHaveLength(1);
    expect(result!.data[0].classificationType).toBe("Individual");
    expect(result!.data[0].excludingAgency).toBe("DOD");
    expect(result!.data[0].activationDate).toBe("2020-01-15");
  });

  it("handles HTTP errors gracefully", async () => {
    process.env.SAM_GOV_API_KEY = "test-key";
    const fetchMock = mockFetchResponse("Server Error", 500);
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

    const client = new SamGovClient(clientOptions);
    const result = await client.searchEntity("ACME Corp");

    expect(result).not.toBeNull();
    expect(result!.data).toBeNull();
    expect(result!.errors).toBeDefined();
    expect(result!.errors!.length).toBeGreaterThan(0);
  });
});

// ─── SubAwards Client Tests ─────────────────────────────────────────────────

describe("SubAwardsClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const clientOptions = {
    baseUrl: "https://api.usaspending.gov/api/v2",
    requestsPerSecond: 10,
    maxRetries: 0,
    maxPerAward: 100,
    cacheDirectory: "/tmp/test-cache-sub",
    cacheEnabled: false,
    logger: mockLogger,
  };

  it("fetches sub-awards for a prime award", async () => {
    const apiResponse = {
      results: [
        {
          subaward_number: "SUB-001",
          amount: 50000,
          action_date: "2023-06-15",
          recipient_name: "Sub Contractor LLC",
          recipient_unique_id: "XYZ789",
          description: "Subcontract for services",
          prime_award_internal_id: "AWARD-123",
          prime_recipient_name: "Prime Corp",
          place_of_performance: {
            city_name: "Arlington",
            state_code: "VA",
            country_code: "USA",
          },
        },
      ],
      page_metadata: { page: 1, hasNext: false },
    };

    const fetchMock = mockFetchResponse(apiResponse);
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

    const client = new SubAwardsClient(clientOptions);
    const result = await client.fetchSubAwards("AWARD-123");

    expect(result.data).toHaveLength(1);
    expect(result.data[0].subawardNumber).toBe("SUB-001");
    expect(result.data[0].amount).toBe(50000);
    expect(result.data[0].recipientName).toBe("Sub Contractor LLC");
    expect(result.data[0].primeAwardId).toBe("AWARD-123");
    expect(result.data[0].placeOfPerformance?.city).toBe("Arlington");
    expect(result.provenance.source).toBe("usaspending_subawards");
    expect(result.provenance.cacheHit).toBe(false);
    expect(result.provenance.apiKeyUsed).toBe(false);
  });

  it("paginates sub-awards", async () => {
    const page1 = {
      results: [
        { subaward_number: "SUB-001", amount: 10000, action_date: "2023-01-01", recipient_name: "A" },
      ],
      page_metadata: { page: 1, hasNext: true },
    };
    const page2 = {
      results: [
        { subaward_number: "SUB-002", amount: 20000, action_date: "2023-02-01", recipient_name: "B" },
      ],
      page_metadata: { page: 2, hasNext: false },
    };

    let callCount = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      callCount++;
      const data = callCount === 1 ? page1 : page2;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
      } as any);
    });

    const client = new SubAwardsClient(clientOptions);
    const result = await client.fetchSubAwards("AWARD-456");

    expect(result.data).toHaveLength(2);
    expect(result.data[0].subawardNumber).toBe("SUB-001");
    expect(result.data[1].subawardNumber).toBe("SUB-002");
  });

  it("respects maxPerAward limit", async () => {
    const bigPage = {
      results: Array.from({ length: 50 }, (_, i) => ({
        subaward_number: `SUB-${i}`,
        amount: 1000 * i,
        action_date: "2023-01-01",
        recipient_name: `Recipient ${i}`,
      })),
      page_metadata: { page: 1, hasNext: true },
    };

    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(bigPage),
        text: () => Promise.resolve(""),
      } as any),
    );

    const client = new SubAwardsClient({ ...clientOptions, maxPerAward: 10 });
    const result = await client.fetchSubAwards("AWARD-789");

    expect(result.data.length).toBeLessThanOrEqual(10);
  });

  it("handles HTTP errors gracefully", async () => {
    const fetchMock = mockFetchResponse("Internal Server Error", 500);
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

    const client = new SubAwardsClient(clientOptions);
    const result = await client.fetchSubAwards("AWARD-BAD");

    expect(result.data).toEqual([]);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });
});

// ─── OpenSanctions Client Tests ─────────────────────────────────────────────

describe("OpenSanctionsClient", () => {
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalApiKey = process.env.OPENSANCTIONS_API_KEY;
  });

  afterEach(() => {
    if (originalApiKey !== undefined) {
      process.env.OPENSANCTIONS_API_KEY = originalApiKey;
    } else {
      delete process.env.OPENSANCTIONS_API_KEY;
    }
    vi.restoreAllMocks();
  });

  const clientOptions = {
    baseUrl: "https://api.opensanctions.org",
    dataset: "default",
    scoreThreshold: 0.7,
    maxRetries: 0,
    cacheDirectory: "/tmp/test-cache-sanctions",
    cacheEnabled: false,
    logger: mockLogger,
  };

  it("returns null when API key is not set", async () => {
    delete process.env.OPENSANCTIONS_API_KEY;
    const client = new OpenSanctionsClient(clientOptions);
    const result = await client.screenEntity("ACME Corp");

    expect(result).toBeNull();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it("returns match when entity found above threshold", async () => {
    process.env.OPENSANCTIONS_API_KEY = "test-key";
    const matchResponse = {
      responses: {
        q1: {
          query: { properties: { name: ["Shady Corp"] } },
          results: [
            {
              id: "entity-123",
              caption: "Shady Corporation Ltd",
              schema: "Company",
              score: 0.85,
              datasets: ["us_ofac_sdn", "eu_sanctions"],
              properties: {
                topics: ["sanction"],
                country: ["RU"],
              },
              referenceUrl: "https://opensanctions.org/entities/entity-123",
            },
          ],
          total: { value: 1 },
        },
      },
    };

    const fetchMock = mockFetchResponse(matchResponse);
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

    const client = new OpenSanctionsClient(clientOptions);
    const result = await client.screenEntity("Shady Corp");

    expect(result).not.toBeNull();
    expect(result!.data.matchFound).toBe(true);
    expect(result!.data.score).toBe(0.85);
    expect(result!.data.matchedName).toBe("Shady Corporation Ltd");
    expect(result!.data.datasets).toContain("us_ofac_sdn");
    expect(result!.data.topics).toContain("sanction");
    expect(result!.data.countries).toContain("RU");
    expect(result!.provenance.source).toBe("open_sanctions");
    expect(result!.provenance.apiKeyUsed).toBe(true);
  });

  it("returns no match when score below threshold", async () => {
    process.env.OPENSANCTIONS_API_KEY = "test-key";
    const matchResponse = {
      responses: {
        q1: {
          query: { properties: { name: ["Good Corp"] } },
          results: [
            {
              id: "entity-456",
              caption: "Good Corporation",
              schema: "Company",
              score: 0.4,
              datasets: ["us_ofac_sdn"],
              properties: { topics: [], country: [] },
            },
          ],
          total: { value: 1 },
        },
      },
    };

    const fetchMock = mockFetchResponse(matchResponse);
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

    const client = new OpenSanctionsClient(clientOptions);
    const result = await client.screenEntity("Good Corp");

    expect(result).not.toBeNull();
    expect(result!.data.matchFound).toBe(false);
    expect(result!.data.score).toBe(0.4);
  });

  it("returns no match when no results", async () => {
    process.env.OPENSANCTIONS_API_KEY = "test-key";
    const matchResponse = {
      responses: {
        q1: {
          query: { properties: { name: ["Clean Corp"] } },
          results: [],
          total: { value: 0 },
        },
      },
    };

    const fetchMock = mockFetchResponse(matchResponse);
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

    const client = new OpenSanctionsClient(clientOptions);
    const result = await client.screenEntity("Clean Corp");

    expect(result).not.toBeNull();
    expect(result!.data.matchFound).toBe(false);
    expect(result!.data.score).toBe(0);
  });

  it("handles HTTP errors gracefully", async () => {
    process.env.OPENSANCTIONS_API_KEY = "test-key";
    const fetchMock = mockFetchResponse("Forbidden", 403);
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

    const client = new OpenSanctionsClient(clientOptions);
    const result = await client.screenEntity("Test Corp");

    expect(result).not.toBeNull();
    expect(result!.data.matchFound).toBe(false);
    expect(result!.errors).toBeDefined();
    expect(result!.errors!.length).toBeGreaterThan(0);
  });
});
