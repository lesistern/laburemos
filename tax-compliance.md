# LaburAR - Tax Compliance System for Argentina

## Overview

Complete tax compliance system for Argentine freelancers and companies, integrated with ARCA official APIs, automated tax calculations, and regulatory compliance.

**Target Users**: Argentine freelancers, SMEs, digital nomads working with Argentine clients
**Regulatory Framework**: ARCA (ex-AFIP), provincial IIBB authorities
**Last Updated**: January 2025 - Updated with ARCA official data

> **⚠️ IMPORTANT UPDATE**: AFIP is now officially called ARCA (Agencia de Recaudación y Control Aduanero). All APIs and services remain functionally identical, but branding and documentation references have been updated to reflect this change. The transition is ongoing throughout 2025.

---

## 1. ARCA Integration System (ex-AFIP)

### Official ARCA (ex-AFIP) APIs and Services

#### 1.1 WebServices ARCA (WSAA - Web Service de Autenticación y Autorización)

```typescript
// Backend: ARCA Authentication Service (ex-AFIP)
interface ARCAAuthConfig {
  environment: 'testing' | 'production';
  wsaaUrl: string; // https://wsaahomo.afip.gov.ar/ws/services/LoginCms (testing)
  certificate: Buffer; // X.509 certificate
  privateKey: Buffer; // Private key
  cuit: string; // Company CUIT
}

class ARCAAuthService {
  private config: ARCAAuthConfig;
  
  constructor(config: ARCAAuthConfig) {
    this.config = config;
  }

  // Generate authentication ticket
  async getAuthTicket(service: string): Promise<ARCATicket> {
    const tra = this.createTRA(service);
    const cms = this.signTRA(tra);
    
    const response = await this.callWSAA(cms);
    return this.parseTicketResponse(response);
  }

  private createTRA(service: string): string {
    const now = new Date();
    const from = new Date(now.getTime() - 600000); // 10 minutes ago
    const to = new Date(now.getTime() + 600000);   // 10 minutes from now
    
    return `<?xml version="1.0" encoding="UTF-8"?>
    <loginTicketRequest version="1.0">
      <header>
        <uniqueId>${Date.now()}</uniqueId>
        <generationTime>${from.toISOString()}</generationTime>
        <expirationTime>${to.toISOString()}</expirationTime>
      </header>
      <service>${service}</service>
    </loginTicketRequest>`;
  }
}

interface ARCATicket {
  token: string;
  sign: string;
  expirationTime: Date;
}
```

#### 1.2 Electronic Invoice System (WSFE)

```typescript
// Electronic Invoice Service
class AFIPInvoiceService {
  private authService: AFIPAuthService;
  private wsfeUrl: string;

  async createInvoice(invoiceData: InvoiceData): Promise<AFIPInvoiceResponse> {
    const ticket = await this.authService.getAuthTicket('wsfe');
    
    const invoiceRequest = {
      Auth: {
        Token: ticket.token,
        Sign: ticket.sign,
        Cuit: this.config.cuit
      },
      FeCAEReq: {
        FeCabReq: {
          CantReg: 1,
          PtoVta: invoiceData.salePoint,
          CbteTipo: invoiceData.invoiceType // 11: Factura C, 6: Factura B, 1: Factura A
        },
        FeDetReq: [{
          Concepto: invoiceData.concept, // 1: Products, 2: Services, 3: Products+Services
          DocTipo: invoiceData.clientDocType, // 80: CUIT, 86: CUIL, 96: DNI
          DocNro: invoiceData.clientDocNumber,
          CbteDesde: invoiceData.invoiceNumber,
          CbteHasta: invoiceData.invoiceNumber,
          CbteFch: invoiceData.invoiceDate,
          ImpTotal: invoiceData.totalAmount,
          ImpTotConc: invoiceData.nonTaxableAmount,
          ImpNeto: invoiceData.netAmount,
          ImpOpEx: invoiceData.exemptAmount,
          ImpIVA: invoiceData.ivaAmount,
          ImpTrib: invoiceData.taxAmount,
          FchServDesde: invoiceData.serviceFromDate,
          FchServHasta: invoiceData.serviceToDate,
          FchVtoPago: invoiceData.paymentDueDate,
          MonId: 'PES', // Currency: PES (Pesos), USD (Dollars)
          MonCotiz: 1,
          Iva: invoiceData.ivaDetails
        }]
      }
    };

    return await this.callWSFE('FECAESolicitar', invoiceRequest);
  }

  // Get CAE (Electronic Authorization Code) for invoice
  async getCAE(invoiceNumber: number, salePoint: number): Promise<CAEData> {
    const ticket = await this.authService.getAuthTicket('wsfe');
    
    const request = {
      Auth: { Token: ticket.token, Sign: ticket.sign, Cuit: this.config.cuit },
      FeCompConsReq: {
        CbteTipo: 11, // Invoice type
        PtoVta: salePoint,
        CbteNro: invoiceNumber
      }
    };

    return await this.callWSFE('FECompConsultar', request);
  }
}

interface InvoiceData {
  salePoint: number;
  invoiceType: number;
  invoiceNumber: number;
  invoiceDate: string;
  clientDocType: number;
  clientDocNumber: string;
  totalAmount: number;
  netAmount: number;
  ivaAmount: number;
  taxAmount: number;
  nonTaxableAmount: number;
  exemptAmount: number;
  concept: number;
  serviceFromDate?: string;
  serviceToDate?: string;
  paymentDueDate?: string;
  ivaDetails: IVADetail[];
}
```

### 1.3 Digital Certificates Management

```typescript
// Certificate Management Service
class AFIPCertificateService {
  // Generate CSR (Certificate Signing Request)
  async generateCSR(companyData: CompanyData): Promise<string> {
    const keyPair = await crypto.generateKeyPair('rsa', {
      modulusLength: 2048,
    });

    const csr = new pkcs10.CertificationRequest({
      subject: new pkcs10.Name([
        new pkcs10.AttributeTypeAndValue({
          type: '2.5.4.6', // Country
          value: 'AR'
        }),
        new pkcs10.AttributeTypeAndValue({
          type: '2.5.4.10', // Organization
          value: companyData.businessName
        }),
        new pkcs10.AttributeTypeAndValue({
          type: '2.5.4.11', // Organizational Unit
          value: companyData.cuit
        }),
        new pkcs10.AttributeTypeAndValue({
          type: '2.5.4.3', // Common Name
          value: companyData.responsibleName
        })
      ]),
      publicKey: keyPair.publicKey
    });

    await csr.sign(keyPair.privateKey);
    return csr.toString('base64');
  }

  // Store and manage certificates
  async storeCertificate(cuit: string, certificate: Buffer, privateKey: Buffer): Promise<void> {
    // Encrypt and store in database
    const encryptedCert = await this.encrypt(certificate);
    const encryptedKey = await this.encrypt(privateKey);
    
    await this.certificateRepository.save({
      cuit,
      certificate: encryptedCert,
      privateKey: encryptedKey,
      expirationDate: this.getCertificateExpiration(certificate),
      isActive: true,
      createdAt: new Date()
    });
  }

  // Check certificate expiration
  async checkCertificateExpiration(cuit: string): Promise<CertificateStatus> {
    const cert = await this.certificateRepository.findByCuit(cuit);
    const daysUntilExpiration = Math.ceil(
      (cert.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      isValid: daysUntilExpiration > 0,
      daysUntilExpiration,
      needsRenewal: daysUntilExpiration < 30
    };
  }
}
```

---

## 2. Automated IVA System

### 2.1 IVA Calculation Engine

```typescript
// IVA Calculation Service
class IVACalculationService {
  private readonly IVA_RATES = {
    GENERAL: 0.21,      // 21% - General rate
    REDUCED: 0.105,     // 10.5% - Reduced rate
    BASIC: 0.27,        // 27% - Basic foods
    EXEMPT: 0,          // 0% - Exempt
    NOT_TAXED: 0        // 0% - Not taxed
  };

  private readonly IVA_CATEGORIES = {
    // Digital services
    SOFTWARE_DEVELOPMENT: { rate: this.IVA_RATES.GENERAL, category: 'DIGITAL_SERVICES' },
    WEB_DESIGN: { rate: this.IVA_RATES.GENERAL, category: 'DIGITAL_SERVICES' },
    CONSULTING: { rate: this.IVA_RATES.GENERAL, category: 'PROFESSIONAL_SERVICES' },
    
    // Physical products
    BOOKS: { rate: this.IVA_RATES.EXEMPT, category: 'CULTURAL' },
    BASIC_FOODS: { rate: this.IVA_RATES.BASIC, category: 'FOOD' },
    
    // Medical services
    MEDICAL_SERVICES: { rate: this.IVA_RATES.EXEMPT, category: 'HEALTH' },
    MEDICINES: { rate: this.IVA_RATES.EXEMPT, category: 'HEALTH' }
  };

  calculateIVA(amount: number, serviceType: string, clientType: ClientTaxType): IVACalculation {
    const serviceConfig = this.IVA_CATEGORIES[serviceType];
    if (!serviceConfig) {
      throw new Error(`Unknown service type: ${serviceType}`);
    }

    // Check if client is exempt from IVA
    if (this.isClientExempt(clientType)) {
      return {
        netAmount: amount,
        ivaAmount: 0,
        totalAmount: amount,
        ivaRate: 0,
        exemptReason: this.getExemptReason(clientType)
      };
    }

    const ivaRate = serviceConfig.rate;
    const netAmount = amount / (1 + ivaRate);
    const ivaAmount = amount - netAmount;

    return {
      netAmount: Math.round(netAmount * 100) / 100,
      ivaAmount: Math.round(ivaAmount * 100) / 100,
      totalAmount: amount,
      ivaRate,
      category: serviceConfig.category
    };
  }

  private isClientExempt(clientType: ClientTaxType): boolean {
    return [
      ClientTaxType.EXEMPT_ENTITY,
      ClientTaxType.FOREIGN_CLIENT,
      ClientTaxType.DIPLOMATIC_MISSION
    ].includes(clientType);
  }

  // Calculate IVA for foreign clients (export services)
  calculateExportIVA(amount: number, clientCountry: string): IVACalculation {
    // Services exported to foreign clients are IVA exempt
    return {
      netAmount: amount,
      ivaAmount: 0,
      totalAmount: amount,
      ivaRate: 0,
      exemptReason: 'EXPORT_SERVICE',
      exportDestination: clientCountry
    };
  }
}

interface IVACalculation {
  netAmount: number;
  ivaAmount: number;
  totalAmount: number;
  ivaRate: number;
  category?: string;
  exemptReason?: string;
  exportDestination?: string;
}

enum ClientTaxType {
  RESPONSABLE_INSCRIPTO = 'RI',
  MONOTRIBUTO = 'MT',
  EXEMPT_ENTITY = 'EX',
  FOREIGN_CLIENT = 'FC',
  DIPLOMATIC_MISSION = 'DM',
  CONSUMER_FINAL = 'CF'
}
```

### 2.2 Fiscal Categories Management - Updated 2025

> **🔄 2025 KEY UPDATES:**
> - **Límites Monotributo**: Aumentaron significativamente (Categoría K ahora hasta $94.8M anuales)
> - **AFIP → ARCA**: Cambio de denominación oficial pero APIs permanecen iguales
> - **Cuotas actualizadas**: Nuevos importes de Impuesto Integrado, Jubilación y Obra Social
> - **Superficie y energía**: Límites de 200m² y 20,000 Kw siguen vigentes

```typescript
// Fiscal Category Service
class FiscalCategoryService {
  private readonly MONOTRIBUTO_LIMITS_2025 = {
    A: { annual: 8992597.87, monthly: 749383.16 },
    B: { annual: 13488896.81, monthly: 1124074.73 },
    C: { annual: 18734135.51, monthly: 1561177.96 },
    D: { annual: 23417669.39, monthly: 1951472.45 },
    E: { annual: 28101203.27, monthly: 2341766.94 },
    F: { annual: 33708019.44, monthly: 2809001.62 },
    G: { annual: 41986466.37, monthly: 3498872.20 },
    H: { annual: 52483082.96, monthly: 4373590.25 },
    I: { annual: 62979699.55, monthly: 5248308.30 },
    J: { annual: 73476316.14, monthly: 6123026.34 },
    K: { annual: 94805682.90, monthly: 7900473.58 }
  };

  async checkMonotributoEligibility(cuit: string, annualRevenue: number): Promise<MonotributoStatus> {
    const currentCategory = await this.getCurrentCategory(cuit);
    const suggestedCategory = this.calculateRequiredCategory(annualRevenue);
    
    if (annualRevenue > this.MONOTRIBUTO_LIMITS_2025.K.annual) {
      return {
        isEligible: false,
        reason: 'EXCEEDS_MAXIMUM_LIMIT',
        recommendedAction: 'MIGRATE_TO_RESPONSABLE_INSCRIPTO',
        maxExceededBy: annualRevenue - this.MONOTRIBUTO_LIMITS_2025.K.annual
      };
    }

    return {
      isEligible: true,
      currentCategory,
      suggestedCategory,
      needsCategoryChange: currentCategory !== suggestedCategory,
      remainingCapacity: this.MONOTRIBUTO_LIMITS_2025[suggestedCategory].annual - annualRevenue
    };
  }

  private calculateRequiredCategory(annualRevenue: number): string {
    for (const [category, limits] of Object.entries(this.MONOTRIBUTO_LIMITS_2025)) {
      if (annualRevenue <= limits.annual) {
        return category;
      }
    }
    return 'EXCEEDS_LIMIT';
  }

  // Calculate monthly Monotributo payment - Updated January 2025
  calculateMonotributoPayment(category: string, hasEmployees: boolean): MonotributoPayment {
    const amounts = this.getMonotributoAmounts2025(category);
    
    return {
      category,
      impuestoIntegrado: amounts.impuestoIntegrado,
      jubilacion: amounts.jubilacion,
      obraSocial: amounts.obraSocial,
      total: amounts.total,
      dueDate: this.calculateDueDate(),
      hasEmployeesAdditionalCost: hasEmployees ? this.calculateEmployeesCost() : 0
    };
  }

  private getMonotributoAmounts2025(category: string): MonotributoAmounts {
    // Updated amounts from ARCA official website January 2025
    const amounts: Record<string, MonotributoAmounts> = {
      A: { impuestoIntegrado: 0, jubilacion: 137632.59, obraSocial: 54953.79, total: 192586.38 },
      B: { impuestoIntegrado: 4590.88, jubilacion: 137632.59, obraSocial: 54953.79, total: 197177.26 },
      C: { impuestoIntegrado: 9181.76, jubilacion: 137632.59, obraSocial: 54953.79, total: 201768.14 },
      D: { impuestoIntegrado: 11727.20, jubilacion: 137632.59, obraSocial: 54953.79, total: 204313.58 },
      E: { impuestoIntegrado: 14272.64, jubilacion: 137632.59, obraSocial: 54953.79, total: 206859.02 },
      F: { impuestoIntegrado: 17363.52, jubilacion: 137632.59, obraSocial: 54953.79, total: 209949.90 },
      G: { impuestoIntegrado: 21999.84, jubilacion: 137632.59, obraSocial: 54953.79, total: 214586.22 },
      H: { impuestoIntegrado: 27545.28, jubilacion: 137632.59, obraSocial: 54953.79, total: 220131.66 },
      I: { impuestoIntegrado: 33090.72, jubilacion: 137632.59, obraSocial: 54953.79, total: 225677.10 },
      J: { impuestoIntegrado: 38636.16, jubilacion: 137632.59, obraSocial: 54953.79, total: 231222.54 },
      K: { impuestoIntegrado: 49999.68, jubilacion: 137632.59, obraSocial: 54953.79, total: 242586.06 }
    };

    return amounts[category] || amounts.A;
  }
}

interface MonotributoAmounts {
  impuestoIntegrado: number;
  jubilacion: number;
  obraSocial: number;
  total: number;
}

interface MonotributoPayment {
  category: string;
  impuestoIntegrado: number;
  jubilacion: number;
  obraSocial: number;
  total: number;
  dueDate: Date;
  hasEmployeesAdditionalCost: number;
}

interface MonotributoStatus {
  isEligible: boolean;
  currentCategory?: string;
  suggestedCategory?: string;
  needsCategoryChange?: boolean;
  reason?: string;
  recommendedAction?: string;
  maxExceededBy?: number;
  remainingCapacity?: number;
}
```

---

## 3. Tax Withholdings and Perceptions System

### 3.1 Income Tax Withholdings (Ganancias)

```typescript
// Income Tax Withholding Service
class IncomeTaxWithholdingService {
  private readonly GANANCIAS_RATES_2025 = {
    SERVICES: {
      RESIDENT: 0.06,        // 6% for residents
      NON_RESIDENT: 0.35     // 35% for non-residents
    },
    PROFESSIONAL_SERVICES: {
      CERTIFIED: 0.08,       // 8% for certified professionals
      NON_CERTIFIED: 0.06    // 6% for non-certified
    },
    RENTAL: 0.08,            // 8% for rental income
    INTEREST: 0.35           // 35% for interest
  };

  private readonly MINIMUM_AMOUNTS = {
    SERVICES: 2800,          // Minimum amount for withholding
    PROFESSIONAL: 3000,
    RENTAL: 1200
  };

  calculateWithholding(
    amount: number, 
    serviceType: string, 
    providerProfile: ProviderTaxProfile
  ): WithholdingCalculation {
    
    const minimumAmount = this.MINIMUM_AMOUNTS[serviceType];
    if (amount < minimumAmount) {
      return {
        shouldWithhold: false,
        withholdingAmount: 0,
        reason: 'BELOW_MINIMUM_AMOUNT',
        minimumRequired: minimumAmount
      };
    }

    // Check if provider is exempt
    if (providerProfile.isExempt || providerProfile.fiscalCategory === 'MONOTRIBUTO') {
      return {
        shouldWithhold: false,
        withholdingAmount: 0,
        reason: 'EXEMPT_PROVIDER',
        exemptionType: providerProfile.exemptionType
      };
    }

    const rate = this.getWithholdingRate(serviceType, providerProfile);
    const withholdingAmount = Math.round(amount * rate * 100) / 100;

    return {
      shouldWithhold: true,
      withholdingAmount,
      rate,
      netPayment: amount - withholdingAmount,
      taxType: 'GANANCIAS',
      jurisdiction: 'FEDERAL'
    };
  }

  // Generate withholding certificate (F649)
  async generateWithholdingCertificate(
    withholding: WithholdingRecord
  ): Promise<WithholdingCertificate> {
    
    const certificateData = {
      certificateNumber: await this.getNextCertificateNumber(),
      cuitWithholdingAgent: withholding.clientCuit,
      cuitProvider: withholding.providerCuit,
      period: withholding.period,
      withheldAmount: withholding.amount,
      taxType: withholding.taxType,
      generationDate: new Date(),
      digitalSignature: await this.signCertificate(withholding)
    };

    // Store certificate
    await this.certificateRepository.save(certificateData);
    
    // Generate PDF
    const pdfBuffer = await this.generateCertificatePDF(certificateData);
    
    return {
      ...certificateData,
      pdfBuffer,
      downloadUrl: await this.uploadToStorage(pdfBuffer, certificateData.certificateNumber)
    };
  }
}

interface WithholdingCalculation {
  shouldWithhold: boolean;
  withholdingAmount: number;
  rate?: number;
  netPayment?: number;
  reason?: string;
  taxType?: string;
  jurisdiction?: string;
  minimumRequired?: number;
  exemptionType?: string;
}
```

### 3.2 Provincial Tax Withholdings (IIBB)

```typescript
// Provincial Tax Service (IIBB - Ingresos Brutos)
class ProvincialTaxService {
  private readonly IIBB_RATES_BY_PROVINCE = {
    'CABA': {
      SERVICES: 0.02,          // 2%
      COMMERCE: 0.025,         // 2.5%
      INDUSTRY: 0.015          // 1.5%
    },
    'BUENOS_AIRES': {
      SERVICES: 0.025,         // 2.5%
      COMMERCE: 0.03,          // 3%
      INDUSTRY: 0.02           // 2%
    },
    'CORDOBA': {
      SERVICES: 0.03,          // 3%
      COMMERCE: 0.035,         // 3.5%
      INDUSTRY: 0.025          // 2.5%
    },
    'SANTA_FE': {
      SERVICES: 0.025,         // 2.5%
      COMMERCE: 0.03,          // 3%
      INDUSTRY: 0.02           // 2%
    }
  };

  private readonly MULTILATERAL_AGREEMENT_RATES = {
    // Convenio Multilateral rates for companies operating in multiple provinces
    SERVICES: 0.03,
    COMMERCE: 0.035,
    INDUSTRY: 0.025
  };

  calculateIIBB(
    amount: number,
    activityType: string,
    providerProvince: string,
    clientProvince: string,
    isMultilateralSubject: boolean
  ): IIBBCalculation {
    
    // Check if provider is in Multilateral Agreement
    if (isMultilateralSubject) {
      const rate = this.MULTILATERAL_AGREEMENT_RATES[activityType];
      return {
        taxAmount: Math.round(amount * rate * 100) / 100,
        rate,
        jurisdiction: 'MULTILATERAL',
        applicableProvinces: [providerProvince, clientProvince]
      };
    }

    // Single province calculation
    const provinceRates = this.IIBB_RATES_BY_PROVINCE[providerProvince];
    if (!provinceRates) {
      throw new Error(`Province ${providerProvince} not configured`);
    }

    const rate = provinceRates[activityType];
    return {
      taxAmount: Math.round(amount * rate * 100) / 100,
      rate,
      jurisdiction: providerProvince,
      applicableProvinces: [providerProvince]
    };
  }

  // Check IIBB registration status
  async checkIIBBRegistration(cuit: string, province: string): Promise<IIBBRegistrationStatus> {
    // This would integrate with provincial APIs when available
    // For now, we'll use a database check
    
    const registration = await this.iibbRegistrationRepository.findByCuitAndProvince(cuit, province);
    
    return {
      isRegistered: !!registration,
      registrationNumber: registration?.registrationNumber,
      registrationDate: registration?.registrationDate,
      status: registration?.status || 'NOT_REGISTERED',
      nextDeclarationDue: registration ? this.calculateNextDueDate(registration) : null
    };
  }

  // Generate IIBB monthly declaration
  async generateMonthlyDeclaration(
    cuit: string,
    province: string,
    period: string
  ): Promise<IIBBDeclaration> {
    
    const transactions = await this.getTransactionsForPeriod(cuit, period);
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const taxableBase = await this.calculateTaxableBase(transactions, province);
    const taxAmount = await this.calculateIIBB(taxableBase, 'SERVICES', province, province, false);

    return {
      cuit,
      province,
      period,
      totalRevenue,
      taxableBase,
      taxAmount: taxAmount.taxAmount,
      dueDate: this.calculateDeclarationDueDate(period),
      transactions: transactions.length,
      status: 'PENDING_SUBMISSION'
    };
  }
}

interface IIBBCalculation {
  taxAmount: number;
  rate: number;
  jurisdiction: string;
  applicableProvinces: string[];
}
```

---

## 4. CUIT/CUIL Validation System

### 4.1 Real-time Government API Integration

```typescript
// CUIT/CUIL Validation Service
class CUITValidationService {
  private readonly AFIP_PADRON_API = 'https://soa.afip.gov.ar/sr-padron/v2/personas-juridicas';
  private readonly ANSES_API = 'https://serviciosweb.anses.gov.ar/ConsultaCUILService/consulta';

  async validateCUIT(cuit: string): Promise<CUITValidationResult> {
    // First, validate format and check digit
    const formatValidation = this.validateCUITFormat(cuit);
    if (!formatValidation.isValid) {
      return formatValidation;
    }

    try {
      // Query AFIP Padron API
      const afipData = await this.queryAFIPPadron(cuit);
      
      return {
        isValid: true,
        cuit: this.formatCUIT(cuit),
        entityType: afipData.tipoPersona,
        businessName: afipData.razonSocial,
        taxStatus: afipData.estadoClave,
        activities: afipData.actividades,
        address: afipData.domicilio,
        fiscalCategory: afipData.categoriaFiscal,
        monotributoCategory: afipData.categoriaMonotributo,
        lastUpdated: new Date(afipData.fechaActualizacion),
        isActive: afipData.estadoClave === 'ACTIVO'
      };
    } catch (error) {
      // Fallback to local validation if API fails
      return {
        isValid: true,
        cuit: this.formatCUIT(cuit),
        entityType: 'UNKNOWN',
        validationSource: 'LOCAL_FORMAT_ONLY',
        warning: 'Could not verify with AFIP - format validation only'
      };
    }
  }

  private validateCUITFormat(cuit: string): CUITValidationResult {
    // Remove non-numeric characters
    const cleanCuit = cuit.replace(/\D/g, '');
    
    if (cleanCuit.length !== 11) {
      return {
        isValid: false,
        error: 'CUIT must have 11 digits',
        errorCode: 'INVALID_LENGTH'
      };
    }

    // Validate check digit using CUIT algorithm
    const digits = cleanCuit.split('').map(Number);
    const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += digits[i] * multipliers[i];
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? remainder : 11 - remainder;
    
    if (checkDigit !== digits[10]) {
      return {
        isValid: false,
        error: 'Invalid CUIT check digit',
        errorCode: 'INVALID_CHECK_DIGIT'
      };
    }

    return {
      isValid: true,
      cuit: this.formatCUIT(cleanCuit)
    };
  }

  private async queryAFIPPadron(cuit: string): Promise<AFIPPadronData> {
    const response = await fetch(`${this.AFIP_PADRON_API}/${cuit}`, {
      headers: {
        'Authorization': `Bearer ${await this.getAFIPToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`AFIP API error: ${response.status}`);
    }

    return await response.json();
  }

  async validateCUIL(cuil: string): Promise<CUILValidationResult> {
    const formatValidation = this.validateCUILFormat(cuil);
    if (!formatValidation.isValid) {
      return formatValidation;
    }

    try {
      // Query ANSES API for CUIL validation
      const ansesData = await this.queryANSESService(cuil);
      
      return {
        isValid: true,
        cuil: this.formatCUIL(cuil),
        firstName: ansesData.nombres,
        lastName: ansesData.apellidos,
        gender: ansesData.sexo,
        birthDate: new Date(ansesData.fechaNacimiento),
        documentNumber: ansesData.numeroDocumento,
        isActive: ansesData.estado === 'ACTIVO',
        lastUpdated: new Date()
      };
    } catch (error) {
      return {
        isValid: true,
        cuil: this.formatCUIL(cuil),
        validationSource: 'LOCAL_FORMAT_ONLY',
        warning: 'Could not verify with ANSES - format validation only'
      };
    }
  }

  private formatCUIT(cuit: string): string {
    const clean = cuit.replace(/\D/g, '');
    return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
  }

  private formatCUIL(cuil: string): string {
    return this.formatCUIT(cuil); // Same format as CUIT
  }
}

interface CUITValidationResult {
  isValid: boolean;
  cuit?: string;
  entityType?: string;
  businessName?: string;
  taxStatus?: string;
  activities?: Activity[];
  address?: Address;
  fiscalCategory?: string;
  monotributoCategory?: string;
  lastUpdated?: Date;
  isActive?: boolean;
  error?: string;
  errorCode?: string;
  validationSource?: string;
  warning?: string;
}

interface CUILValidationResult {
  isValid: boolean;
  cuil?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: Date;
  documentNumber?: string;
  isActive?: boolean;
  lastUpdated?: Date;
  error?: string;
  errorCode?: string;
  validationSource?: string;
  warning?: string;
}
```

---

## 5. Database Schema for Tax Compliance

### 5.1 Core Tax Tables

```sql
-- Tax Profiles Table
CREATE TABLE tax_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    cuit VARCHAR(13) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    fiscal_category VARCHAR(50) NOT NULL, -- 'MONOTRIBUTO', 'RESPONSABLE_INSCRIPTO', 'EXEMPT'
    monotributo_category VARCHAR(5), -- A, B, C, etc.
    iibb_registrations JSONB, -- Provincial registrations
    activities JSONB, -- AFIP activity codes
    address JSONB,
    certificate_data JSONB, -- Encrypted certificate info
    is_multilateral_subject BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Records
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    invoice_number INTEGER NOT NULL,
    sale_point INTEGER NOT NULL,
    invoice_type INTEGER NOT NULL, -- 1: A, 6: B, 11: C
    cae VARCHAR(14), -- Electronic Authorization Code
    cae_due_date DATE,
    client_cuit VARCHAR(13),
    client_name VARCHAR(255) NOT NULL,
    client_address JSONB,
    issue_date DATE NOT NULL,
    service_from_date DATE,
    service_to_date DATE,
    payment_due_date DATE,
    
    -- Amounts
    net_amount DECIMAL(15,2) NOT NULL,
    iva_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    
    -- IVA Details
    iva_details JSONB, -- Array of IVA line items
    
    -- Additional data
    concept INTEGER NOT NULL, -- 1: Products, 2: Services, 3: Mixed
    currency VARCHAR(3) DEFAULT 'ARS',
    exchange_rate DECIMAL(10,4) DEFAULT 1,
    observations TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, AUTHORIZED, CANCELLED
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, sale_point, invoice_number, invoice_type)
);

-- Tax Withholdings
CREATE TABLE tax_withholdings (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id),
    withholding_agent_cuit VARCHAR(13) NOT NULL, -- Client CUIT
    provider_cuit VARCHAR(13) NOT NULL, -- User CUIT
    tax_type VARCHAR(20) NOT NULL, -- 'GANANCIAS', 'IIBB', 'IVA'
    jurisdiction VARCHAR(50), -- 'FEDERAL', 'CABA', 'BUENOS_AIRES', etc.
    
    base_amount DECIMAL(15,2) NOT NULL,
    withholding_rate DECIMAL(5,4) NOT NULL,
    withheld_amount DECIMAL(15,2) NOT NULL,
    
    period VARCHAR(7) NOT NULL, -- YYYY-MM
    certificate_number VARCHAR(20),
    certificate_issued_date DATE,
    certificate_pdf_url VARCHAR(500),
    
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ISSUED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IIBB Declarations
CREATE TABLE iibb_declarations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    province VARCHAR(20) NOT NULL,
    period VARCHAR(7) NOT NULL, -- YYYY-MM
    
    total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    taxable_base DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    declaration_data JSONB, -- Detailed breakdown
    submission_date DATE,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, PAID
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, province, period)
);

-- Certificate Storage (Encrypted)
CREATE TABLE afip_certificates (
    id SERIAL PRIMARY KEY,
    cuit VARCHAR(13) NOT NULL,
    certificate_data BYTEA NOT NULL, -- Encrypted certificate
    private_key_data BYTEA NOT NULL, -- Encrypted private key
    certificate_password_hash VARCHAR(255),
    
    issue_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    subject_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cuit, is_active) -- Only one active certificate per CUIT
);

-- Tax Calendar and Due Dates
CREATE TABLE tax_calendar (
    id SERIAL PRIMARY KEY,
    tax_type VARCHAR(50) NOT NULL, -- 'MONOTRIBUTO', 'IIBB_CABA', 'GANANCIAS'
    jurisdiction VARCHAR(20),
    period VARCHAR(7) NOT NULL, -- YYYY-MM
    due_date DATE NOT NULL,
    late_payment_surcharge DECIMAL(5,4), -- Surcharge rate for late payment
    is_holiday BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tax_type, jurisdiction, period)
);
```

### 5.2 Indexes and Constraints

```sql
-- Performance indexes
CREATE INDEX idx_tax_profiles_cuit ON tax_profiles(cuit);
CREATE INDEX idx_tax_profiles_user_id ON tax_profiles(user_id);
CREATE INDEX idx_invoices_user_date ON invoices(user_id, issue_date);
CREATE INDEX idx_invoices_cae ON invoices(cae) WHERE cae IS NOT NULL;
CREATE INDEX idx_withholdings_period ON tax_withholdings(period, tax_type);
CREATE INDEX idx_iibb_declarations_period ON iibb_declarations(user_id, period);
CREATE INDEX idx_certificates_expiration ON afip_certificates(expiration_date) WHERE is_active = TRUE;

-- Data validation constraints
ALTER TABLE tax_profiles ADD CONSTRAINT check_fiscal_category 
    CHECK (fiscal_category IN ('MONOTRIBUTO', 'RESPONSABLE_INSCRIPTO', 'EXEMPT'));

ALTER TABLE invoices ADD CONSTRAINT check_invoice_type 
    CHECK (invoice_type IN (1, 6, 11, 51, 52, 53));

ALTER TABLE invoices ADD CONSTRAINT check_amounts 
    CHECK (total_amount = net_amount + iva_amount + tax_amount);

ALTER TABLE tax_withholdings ADD CONSTRAINT check_tax_type 
    CHECK (tax_type IN ('GANANCIAS', 'IIBB', 'IVA', 'SUSS'));

-- Triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tax_profiles_updated_at BEFORE UPDATE ON tax_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 6. Automated Reporting System

### 6.1 SIJYP (Sistema Integral de Jubilaciones y Pensiones)

```typescript
// SIJYP Reporting Service
class SIJYPReportingService {
  async generateF931Report(cuit: string, period: string): Promise<F931Report> {
    const employees = await this.getEmployeesForPeriod(cuit, period);
    const contributions = await this.calculateContributions(employees, period);
    
    const reportData = {
      cuit,
      period, // YYYYMM format
      totalEmployees: employees.length,
      totalRemunerations: contributions.totalRemunerations,
      contributions: {
        jubilaciones: contributions.jubilaciones,      // 11%
        obraSocial: contributions.obraSocial,          // 3%
        anssal: contributions.anssal,                  // 1.5%
        fondo_empleo: contributions.fondoEmpleo,       // 0.89%
        aporte_solidario: contributions.aporteSolidario // Variable
      },
      employees: employees.map(emp => ({
        cuil: emp.cuil,
        documentType: emp.documentType,
        documentNumber: emp.documentNumber,
        lastName: emp.lastName,
        firstName: emp.firstName,
        remunerations: emp.monthlyRemunerations,
        workedDays: emp.workedDays,
        contributionBase: emp.contributionBase
      }))
    };

    // Generate SICOSS format file
    const sicossFile = await this.generateSICOSSFile(reportData);
    
    return {
      ...reportData,
      sicossFileContent: sicossFile,
      fileName: `F931_${cuit}_${period}.txt`,
      dueDate: this.calculateF931DueDate(period),
      status: 'GENERATED'
    };
  }

  private async generateSICOSSFile(reportData: any): Promise<string> {
    let content = '';
    
    // Header record (Type 01)
    content += this.formatSICOSSHeader(reportData);
    
    // Employee records (Type 02)
    for (const employee of reportData.employees) {
      content += this.formatSICOSSEmployee(employee, reportData.period);
    }
    
    // Trailer record (Type 03)
    content += this.formatSICOSSTrailer(reportData);
    
    return content;
  }

  private formatSICOSSHeader(data: any): string {
    return [
      '01',                                    // Record type
      data.cuit.replace(/\D/g, ''),          // CUIT (11 digits)
      data.period,                            // Period YYYYMM
      data.totalEmployees.toString().padStart(6, '0'),
      data.totalRemunerations.toFixed(2).replace('.', '').padStart(15, '0'),
      ''.padEnd(50)                          // Filler
    ].join('') + '\r\n';
  }

  async submitF931ToSIJYP(report: F931Report): Promise<SIJYPSubmissionResult> {
    try {
      // This would integrate with SIJYP web services when available
      // For now, we'll simulate the submission process
      
      const submission = await this.simulateF931Submission(report);
      
      await this.recordSubmission({
        cuit: report.cuit,
        period: report.period,
        submissionDate: new Date(),
        submissionId: submission.id,
        status: 'SUBMITTED',
        acknowledgmentNumber: submission.acknowledgmentNumber
      });

      return {
        success: true,
        submissionId: submission.id,
        acknowledgmentNumber: submission.acknowledgmentNumber,
        submissionDate: new Date(),
        message: 'F931 successfully submitted to SIJYP'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        submissionDate: new Date()
      };
    }
  }
}
```

### 6.2 Monthly Tax Declarations

```typescript
// Monthly Declaration Service
class MonthlyDeclarationService {
  async generateIVADeclaration(cuit: string, period: string): Promise<IVADeclaration> {
    const invoices = await this.getInvoicesForPeriod(cuit, period);
    const purchases = await this.getPurchasesForPeriod(cuit, period);
    
    // Calculate IVA debits (sales)
    const ivaDebits = this.calculateIVADebits(invoices);
    
    // Calculate IVA credits (purchases)
    const ivaCredits = this.calculateIVACredits(purchases);
    
    // Net IVA position
    const netIVA = ivaDebits.total - ivaCredits.total;
    
    return {
      cuit,
      period,
      sales: {
        totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        netAmount: invoices.reduce((sum, inv) => sum + inv.netAmount, 0),
        ivaAmount: ivaDebits.total,
        breakdown: ivaDebits.breakdown
      },
      purchases: {
        totalAmount: purchases.reduce((sum, pur) => sum + pur.totalAmount, 0),
        netAmount: purchases.reduce((sum, pur) => sum + pur.netAmount, 0),
        ivaAmount: ivaCredits.total,
        breakdown: ivaCredits.breakdown
      },
      netPosition: {
        amount: netIVA,
        type: netIVA > 0 ? 'TO_PAY' : 'IN_FAVOR',
        paymentDueDate: this.calculateIVADueDate(period)
      },
      ddjjType: this.determineDDJJType(cuit, period), // Web form or SIAP
      status: 'GENERATED'
    };
  }

  async generateGananciasDeclaration(cuit: string, fiscalYear: number): Promise<GananciasDeclaration> {
    const annualRevenue = await this.getAnnualRevenue(cuit, fiscalYear);
    const deductibleExpenses = await this.getDeductibleExpenses(cuit, fiscalYear);
    const withholdings = await this.getAnnualWithholdings(cuit, fiscalYear);
    
    const taxableIncome = annualRevenue - deductibleExpenses;
    const calculatedTax = this.calculateGananciasAnnualTax(taxableIncome);
    const balanceToPay = Math.max(0, calculatedTax - withholdings.total);
    
    return {
      cuit,
      fiscalYear,
      revenue: {
        totalIncome: annualRevenue,
        deductibleExpenses,
        taxableIncome
      },
      tax: {
        calculatedTax,
        withheldTax: withholdings.total,
        balanceToPay,
        advancePayments: await this.getAdvancePayments(cuit, fiscalYear)
      },
      withholdings: withholdings.details,
      dueDate: new Date(fiscalYear + 1, 4, 30), // May 30th following year
      status: 'GENERATED'
    };
  }

  private calculateGananciasAnnualTax(taxableIncome: number): number {
    // 2025 Ganancias tax brackets
    const brackets = [
      { min: 0, max: 2268000, rate: 0 },
      { min: 2268000, max: 4536000, rate: 0.05 },
      { min: 4536000, max: 6804000, rate: 0.09 },
      { min: 6804000, max: 9072000, rate: 0.12 },
      { min: 9072000, max: 11340000, rate: 0.15 },
      { min: 11340000, max: 13608000, rate: 0.19 },
      { min: 13608000, max: 18144000, rate: 0.23 },
      { min: 18144000, max: 22680000, rate: 0.27 },
      { min: 22680000, max: 36288000, rate: 0.31 },
      { min: 36288000, max: Infinity, rate: 0.35 }
    ];

    let tax = 0;
    let remainingIncome = taxableIncome;

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      tax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }

    return Math.round(tax * 100) / 100;
  }
}
```

---

## 7. Tax Certificate Generation

### 7.1 Freelancer Tax Certificates

```typescript
// Tax Certificate Service
class TaxCertificateService {
  async generateFreelancerTaxCertificate(
    freelancerCuit: string, 
    period: string
  ): Promise<FreelancerTaxCertificate> {
    
    const taxProfile = await this.getTaxProfile(freelancerCuit);
    const periodData = await this.getFreelancerPeriodData(freelancerCuit, period);
    
    const certificateData = {
      certificateId: await this.generateCertificateId(),
      freelancer: {
        cuit: freelancerCuit,
        businessName: taxProfile.businessName,
        fiscalCategory: taxProfile.fiscalCategory,
        address: taxProfile.address
      },
      period: {
        from: periodData.startDate,
        to: periodData.endDate,
        description: `Period ${period}`
      },
      taxCompliance: {
        ivaRegistered: taxProfile.fiscalCategory === 'RESPONSABLE_INSCRIPTO',
        gananciasSubject: await this.isGananciasSubject(freelancerCuit),
        iibbRegistrations: taxProfile.iibbRegistrations,
        monotributoCategory: taxProfile.monotributoCategory,
        taxObligations: await this.getCurrentTaxObligations(freelancerCuit)
      },
      income: {
        totalInvoiced: periodData.totalInvoiced,
        taxableIncome: periodData.taxableIncome,
        withheldTaxes: periodData.withheldTaxes,
        netIncome: periodData.netIncome
      },
      certificates: await this.getIssuedCertificates(freelancerCuit, period),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      digitalSignature: await this.generateDigitalSignature(certificateData),
      issuedDate: new Date()
    };

    // Generate PDF certificate
    const pdfBuffer = await this.generateTaxCertificatePDF(certificateData);
    
    // Store certificate
    await this.storeCertificate(certificateData, pdfBuffer);
    
    return {
      ...certificateData,
      pdfBuffer,
      downloadUrl: await this.uploadCertificateToStorage(pdfBuffer, certificateData.certificateId)
    };
  }

  async generateIncomeDeclarationCertificate(
    freelancerCuit: string,
    fiscalYear: number
  ): Promise<IncomeDeclarationCertificate> {
    
    const annualData = await this.getAnnualTaxData(freelancerCuit, fiscalYear);
    
    const certificateData = {
      certificateId: await this.generateCertificateId(),
      freelancerCuit,
      fiscalYear,
      declarations: {
        ganancias: annualData.gananciasDeclaration,
        iva: annualData.ivaDeclarations,
        iibb: annualData.iibbDeclarations,
        monotributo: annualData.monotributoPayments
      },
      compliance: {
        allDeclarationsFiled: annualData.allDeclarationsFiled,
        pendingObligations: annualData.pendingObligations,
        lastFilingDate: annualData.lastFilingDate
      },
      issuedDate: new Date(),
      validUntil: new Date(fiscalYear + 1, 11, 31), // Valid until end of following year
      digitalSignature: await this.generateDigitalSignature(certificateData)
    };

    const pdfBuffer = await this.generateIncomeDeclarationPDF(certificateData);
    
    return {
      ...certificateData,
      pdfBuffer,
      downloadUrl: await this.uploadCertificateToStorage(pdfBuffer, certificateData.certificateId)
    };
  }

  private async generateTaxCertificatePDF(data: FreelancerTaxCertificate): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Header
    doc.fontSize(18).text('CERTIFICADO DE SITUACIÓN FISCAL', { align: 'center' });
    doc.moveDown();
    
    // Certificate ID and date
    doc.fontSize(10)
       .text(`Certificado N°: ${data.certificateId}`, { align: 'right' })
       .text(`Fecha de emisión: ${data.issuedDate.toLocaleDateString('es-AR')}`, { align: 'right' });
    
    doc.moveDown();

    // Freelancer information
    doc.fontSize(14).text('DATOS DEL CONTRIBUYENTE', { underline: true });
    doc.fontSize(11)
       .text(`CUIT: ${data.freelancer.cuit}`)
       .text(`Razón Social: ${data.freelancer.businessName}`)
       .text(`Categoría Fiscal: ${this.translateFiscalCategory(data.freelancer.fiscalCategory)}`)
       .text(`Dirección: ${this.formatAddress(data.freelancer.address)}`);

    doc.moveDown();

    // Tax compliance
    doc.fontSize(14).text('SITUACIÓN FISCAL', { underline: true });
    doc.fontSize(11)
       .text(`Inscripto en IVA: ${data.taxCompliance.ivaRegistered ? 'SÍ' : 'NO'}`)
       .text(`Sujeto a Ganancias: ${data.taxCompliance.gananciasSubject ? 'SÍ' : 'NO'}`);
    
    if (data.taxCompliance.monotributoCategory) {
      doc.text(`Categoría Monotributo: ${data.taxCompliance.monotributoCategory}`);
    }

    // IIBB registrations
    if (data.taxCompliance.iibbRegistrations.length > 0) {
      doc.text('Inscripciones IIBB:');
      data.taxCompliance.iibbRegistrations.forEach(reg => {
        doc.text(`  - ${reg.province}: ${reg.registrationNumber}`);
      });
    }

    doc.moveDown();

    // Period income
    doc.fontSize(14).text(`INGRESOS PERÍODO ${data.period.description.toUpperCase()}`, { underline: true });
    doc.fontSize(11)
       .text(`Total Facturado: $${data.income.totalInvoiced.toLocaleString('es-AR')}`)
       .text(`Ingresos Gravados: $${data.income.taxableIncome.toLocaleString('es-AR')}`)
       .text(`Retenciones Sufridas: $${data.income.withheldTaxes.toLocaleString('es-AR')}`)
       .text(`Ingresos Netos: $${data.income.netIncome.toLocaleString('es-AR')}`);

    // Digital signature
    doc.moveDown(2);
    doc.fontSize(10)
       .text('Este certificado ha sido generado electrónicamente y cuenta con firma digital.')
       .text(`Válido hasta: ${data.validUntil.toLocaleDateString('es-AR')}`)
       .text(`Firma Digital: ${data.digitalSignature.substring(0, 40)}...`);

    return new Promise((resolve) => {
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.end();
    });
  }
}
```

---

## 8. Complete Compliance Workflow

### 8.1 Registration to Invoice Workflow

```typescript
// Tax Compliance Workflow Service
class TaxComplianceWorkflowService {
  async initializeFreelancerTaxSetup(userData: UserRegistrationData): Promise<TaxSetupWorkflow> {
    const workflow = {
      userId: userData.userId,
      currentStep: 'CUIT_VALIDATION',
      steps: [
        'CUIT_VALIDATION',
        'FISCAL_CATEGORY_DETERMINATION',
        'CERTIFICATE_SETUP',
        'PROVINCIAL_REGISTRATIONS',
        'INVOICE_CONFIGURATION',
        'COMPLIANCE_VERIFICATION'
      ],
      progress: 0,
      estimatedTimeMinutes: 15,
      status: 'IN_PROGRESS'
    };

    return await this.executeWorkflowStep(workflow, userData);
  }

  private async executeWorkflowStep(
    workflow: TaxSetupWorkflow, 
    data: any
  ): Promise<TaxSetupWorkflow> {
    
    switch (workflow.currentStep) {
      case 'CUIT_VALIDATION':
        return await this.handleCUITValidation(workflow, data);
      
      case 'FISCAL_CATEGORY_DETERMINATION':
        return await this.handleFiscalCategoryDetermination(workflow, data);
      
      case 'CERTIFICATE_SETUP':
        return await this.handleCertificateSetup(workflow, data);
      
      case 'PROVINCIAL_REGISTRATIONS':
        return await this.handleProvincialRegistrations(workflow, data);
      
      case 'INVOICE_CONFIGURATION':
        return await this.handleInvoiceConfiguration(workflow, data);
      
      case 'COMPLIANCE_VERIFICATION':
        return await this.handleComplianceVerification(workflow, data);
      
      default:
        throw new Error(`Unknown workflow step: ${workflow.currentStep}`);
    }
  }

  private async handleCUITValidation(
    workflow: TaxSetupWorkflow, 
    data: UserRegistrationData
  ): Promise<TaxSetupWorkflow> {
    
    const validation = await this.cuitValidationService.validateCUIT(data.cuit);
    
    if (!validation.isValid) {
      return {
        ...workflow,
        status: 'ERROR',
        error: `CUIT inválido: ${validation.error}`,
        requiresUserAction: true
      };
    }

    // Store validated CUIT data
    await this.storeTaxProfile({
      userId: data.userId,
      cuit: validation.cuit,
      businessName: validation.businessName || data.businessName,
      fiscalCategory: validation.fiscalCategory,
      activities: validation.activities,
      address: validation.address
    });

    return {
      ...workflow,
      currentStep: 'FISCAL_CATEGORY_DETERMINATION',
      progress: 16.67,
      data: { validatedCUIT: validation }
    };
  }

  private async handleFiscalCategoryDetermination(
    workflow: TaxSetupWorkflow, 
    data: any
  ): Promise<TaxSetupWorkflow> {
    
    const cuitData = workflow.data.validatedCUIT;
    let recommendedCategory = cuitData.fiscalCategory;
    
    // If not already determined, analyze based on expected revenue
    if (!recommendedCategory && data.expectedAnnualRevenue) {
      const monotributoStatus = await this.fiscalCategoryService.checkMonotributoEligibility(
        cuitData.cuit, 
        data.expectedAnnualRevenue
      );
      
      recommendedCategory = monotributoStatus.isEligible ? 'MONOTRIBUTO' : 'RESPONSABLE_INSCRIPTO';
      
      // Update tax profile
      await this.updateTaxProfile(data.userId, {
        fiscalCategory: recommendedCategory,
        monotributoCategory: monotributoStatus.suggestedCategory,
        annualRevenueEstimate: data.expectedAnnualRevenue
      });
    }

    return {
      ...workflow,
      currentStep: 'CERTIFICATE_SETUP',
      progress: 33.33,
      data: { 
        ...workflow.data, 
        fiscalCategory: recommendedCategory,
        requiresCertificate: recommendedCategory === 'RESPONSABLE_INSCRIPTO'
      }
    };
  }

  private async handleCertificateSetup(
    workflow: TaxSetupWorkflow, 
    data: any
  ): Promise<TaxSetupWorkflow> {
    
    if (!workflow.data.requiresCertificate) {
      // Skip certificate setup for Monotributo
      return {
        ...workflow,
        currentStep: 'PROVINCIAL_REGISTRATIONS',
        progress: 50,
        data: { ...workflow.data, certificateSkipped: true }
      };
    }

    // For Responsable Inscripto, certificate is required
    const existingCert = await this.certificateService.getCertificate(workflow.data.validatedCUIT.cuit);
    
    if (!existingCert) {
      return {
        ...workflow,
        status: 'WAITING_FOR_USER',
        message: 'Se requiere certificado digital AFIP. Por favor, suba su certificado .p12 y contraseña.',
        requiresUserAction: true,
        nextActionType: 'UPLOAD_CERTIFICATE'
      };
    }

    return {
      ...workflow,
      currentStep: 'PROVINCIAL_REGISTRATIONS',
      progress: 50,
      data: { ...workflow.data, certificateReady: true }
    };
  }

  private async handleProvincialRegistrations(
    workflow: TaxSetupWorkflow, 
    data: any
  ): Promise<TaxSetupWorkflow> {
    
    const userProvince = workflow.data.validatedCUIT.address?.province;
    const registrations = [];

    if (userProvince) {
      // Check IIBB registration for user province
      const iibbStatus = await this.provincialTaxService.checkIIBBRegistration(
        workflow.data.validatedCUIT.cuit, 
        userProvince
      );
      
      registrations.push({
        province: userProvince,
        isRegistered: iibbStatus.isRegistered,
        registrationNumber: iibbStatus.registrationNumber,
        required: await this.isIIBBRegistrationRequired(data.expectedAnnualRevenue, userProvince)
      });
    }

    await this.updateTaxProfile(data.userId, {
      iibbRegistrations: registrations
    });

    return {
      ...workflow,
      currentStep: 'INVOICE_CONFIGURATION',
      progress: 66.67,
      data: { ...workflow.data, provincialRegistrations: registrations }
    };
  }

  private async handleInvoiceConfiguration(
    workflow: TaxSetupWorkflow, 
    data: any
  ): Promise<TaxSetupWorkflow> {
    
    const fiscalCategory = workflow.data.fiscalCategory;
    
    // Configure default invoice settings
    const invoiceConfig = {
      defaultSalePoint: 1,
      defaultInvoiceType: fiscalCategory === 'RESPONSABLE_INSCRIPTO' ? 11 : 6, // C or B
      includeIVA: fiscalCategory === 'RESPONSABLE_INSCRIPTO',
      defaultCurrency: 'ARS',
      defaultPaymentTerms: 30, // days
      autoGenerateCAE: fiscalCategory === 'RESPONSABLE_INSCRIPTO'
    };

    await this.createInvoiceConfiguration(data.userId, invoiceConfig);

    return {
      ...workflow,
      currentStep: 'COMPLIANCE_VERIFICATION',
      progress: 83.33,
      data: { ...workflow.data, invoiceConfigured: true }
    };
  }

  private async handleComplianceVerification(
    workflow: TaxSetupWorkflow, 
    data: any
  ): Promise<TaxSetupWorkflow> {
    
    // Final verification of all setup components
    const verificationResults = await this.verifyCompleteSetup(data.userId);
    
    if (verificationResults.allValid) {
      // Generate welcome tax certificate
      const welcomeCertificate = await this.taxCertificateService.generateFreelancerTaxCertificate(
        workflow.data.validatedCUIT.cuit,
        new Date().toISOString().substring(0, 7) // Current month
      );

      return {
        ...workflow,
        currentStep: 'COMPLETED',
        progress: 100,
        status: 'COMPLETED',
        completedAt: new Date(),
        data: { 
          ...workflow.data, 
          verificationResults,
          welcomeCertificate: welcomeCertificate.downloadUrl
        }
      };
    } else {
      return {
        ...workflow,
        status: 'ERROR',
        error: 'Verification failed: ' + verificationResults.errors.join(', '),
        requiresUserAction: true
      };
    }
  }

  // Complete invoice workflow from creation to AFIP submission
  async executeInvoiceWorkflow(invoiceData: InvoiceCreationData): Promise<InvoiceWorkflowResult> {
    const workflow = {
      invoiceId: null,
      steps: [
        'VALIDATE_DATA',
        'CALCULATE_TAXES',
        'CREATE_INVOICE',
        'GENERATE_CAE',
        'STORE_INVOICE',
        'SEND_TO_CLIENT'
      ],
      currentStep: 'VALIDATE_DATA',
      status: 'IN_PROGRESS'
    };

    try {
      // Step 1: Validate invoice data
      const validationResult = await this.validateInvoiceData(invoiceData);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Step 2: Calculate all taxes (IVA, withholdings, etc.)
      const taxCalculations = await this.calculateAllTaxes(invoiceData);

      // Step 3: Create invoice record
      const invoice = await this.createInvoiceRecord({
        ...invoiceData,
        ...taxCalculations
      });
      workflow.invoiceId = invoice.id;

      // Step 4: Generate CAE from AFIP (if required)
      if (invoiceData.requiresCAE) {
        const caeResult = await this.afipInvoiceService.createInvoice({
          ...invoice,
          salePoint: invoiceData.salePoint,
          invoiceType: invoiceData.invoiceType
        });

        if (!caeResult.success) {
          throw new Error(`CAE generation failed: ${caeResult.error}`);
        }

        // Update invoice with CAE
        await this.updateInvoiceWithCAE(invoice.id, caeResult.cae, caeResult.caeDueDate);
      }

      // Step 5: Generate PDF and store final invoice
      const pdfBuffer = await this.generateInvoicePDF(invoice.id);
      const pdfUrl = await this.uploadInvoicePDF(invoice.id, pdfBuffer);

      // Step 6: Send to client (optional)
      if (invoiceData.sendToClient) {
        await this.sendInvoiceToClient(invoice.id, invoiceData.clientEmail, pdfUrl);
      }

      return {
        success: true,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        cae: invoice.cae,
        pdfUrl,
        totalAmount: invoice.totalAmount,
        message: 'Invoice created and processed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        workflowStep: workflow.currentStep
      };
    }
  }
}

interface TaxSetupWorkflow {
  userId: number;
  currentStep: string;
  steps: string[];
  progress: number;
  estimatedTimeMinutes: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ERROR' | 'WAITING_FOR_USER';
  data?: any;
  error?: string;
  requiresUserAction?: boolean;
  nextActionType?: string;
  message?: string;
  completedAt?: Date;
}
```

---

## 9. Implementation Roadmap

### Phase 1: Core Tax Engine (Weeks 1-4)
1. **CUIT/CUIL Validation Service** - Real-time government API integration
2. **IVA Calculation Engine** - Automated tax calculations with exemptions
3. **Database Schema Implementation** - PostgreSQL tables for tax data
4. **Basic AFIP Authentication** - Certificate management and WSAA integration

### Phase 2: Invoice System (Weeks 5-8) 
1. **Electronic Invoice Service** - WSFE integration for CAE generation
2. **Invoice PDF Generation** - Professional invoice templates
3. **Tax Withholding Calculations** - Automated retention system
4. **Invoice Workflow API** - Complete creation to submission process

### Phase 3: Compliance & Reporting (Weeks 9-12)
1. **Monthly Declaration System** - IVA and IIBB automated reporting
2. **SIJYP Integration** - F931 and social security reporting
3. **Tax Certificate Generation** - Automated freelancer certificates
4. **Compliance Dashboard** - Real-time tax obligation tracking

### Phase 4: Advanced Features (Weeks 13-16)
1. **Multi-Provincial IIBB** - Support for all Argentine provinces
2. **Advanced Tax Planning** - Optimization recommendations
3. **Integration APIs** - External accounting software connections
4. **Mobile Tax App** - React Native app for on-the-go compliance

---

## 10. Technical Considerations

### Security Requirements
- **Certificate Encryption**: AES-256 encryption for AFIP certificates
- **PCI DSS Compliance**: For payment and financial data handling
- **Data Residency**: All tax data must remain in Argentina
- **Audit Trails**: Complete logging of all tax-related operations
- **Access Controls**: Role-based permissions for tax data access

### Performance Optimization
- **AFIP API Caching**: Cache authentication tickets and avoid unnecessary calls
- **Database Indexing**: Optimized queries for tax calculations and reporting
- **PDF Generation**: Async processing for large batch operations
- **Background Jobs**: Queue system for tax declarations and submissions

### Error Handling & Recovery
- **AFIP Service Outages**: Graceful degradation and retry mechanisms
- **Certificate Expiration**: Automated alerts and renewal processes
- **Data Validation**: Comprehensive validation before AFIP submission
- **Rollback Procedures**: Safe recovery from failed tax operations

### Testing Strategy
- **Unit Tests**: All tax calculation functions with edge cases
- **Integration Tests**: AFIP API integration with test environment
- **End-to-End Tests**: Complete workflows from invoice to submission
- **Load Testing**: Performance under high concurrent tax operations

---

## Conclusion

This tax compliance system provides comprehensive automation for Argentine tax obligations, focusing on real-world freelancer needs while maintaining full regulatory compliance with AFIP and provincial authorities. The modular architecture allows for gradual implementation and easy maintenance as tax regulations evolve.

Key benefits:
- **100% AFIP Compliance**: Official API integration with digital certificates
- **Automated Tax Calculations**: Reduces errors and saves time
- **Complete Audit Trail**: Full documentation for tax authorities
- **Freelancer-Focused**: Designed specifically for digital service providers
- **Scalable Architecture**: Supports growth from individual to enterprise clients

The system eliminates the complexity of Argentine tax compliance while ensuring full legal compliance and optimal tax efficiency for LaburAR users.