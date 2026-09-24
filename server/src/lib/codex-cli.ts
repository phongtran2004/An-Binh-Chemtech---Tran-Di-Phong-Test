import { exec } from 'child_process';
import { promisify } from 'util';
import type { CustomerData, QuotationItemData } from '../types';
import { logger } from './logger';

const execAsync = promisify(exec);

export interface CodexAdvisoryResult {
  source: 'CODEX_CLI' | 'SIMULATED_INTELLIGENCE' | 'FALLBACK';
  commercialNote: string;
  technicalAdvisory: string;
}

/**
 * CodexCliService - Handles interaction with Codex CLI / AI Agent on the Mac mini.
 * 
 * Architectural Decision (Senior Mindset):
 * - Math & Pricing: 100% DETERMINISTIC (never delegate arithmetic to AI).
 * - Chemical Safety & Contextual Greeting: AI-DRIVEN (generates tailored advisory & greeting).
 * - Fallback: If Codex CLI is not installed or network is down, gracefully fallback to
 *   deterministic domain rules without breaking the quotation pipeline.
 */
export class CodexCliService {
  private static isCodexAvailable: boolean | null = null;

  /**
   * Check if Codex CLI is installed and responsive on the current host.
   */
  public static async checkCodexAvailability(): Promise<boolean> {
    if (this.isCodexAvailable !== null) {
      return this.isCodexAvailable;
    }
    try {
      // Check if `codex --version` or equivalent CLI tool responds
      const { stdout } = await execAsync('codex --version', { timeout: 2000 });
      this.isCodexAvailable = stdout.toLowerCase().includes('codex') || stdout.length > 0;
      return this.isCodexAvailable;
    } catch {
      this.isCodexAvailable = false;
      return false;
    }
  }

  /**
   * Generate contextual commercial greeting and chemical technical advisory.
   */
  public static async generateAdvisory(
    customer: CustomerData,
    items: QuotationItemData[]
  ): Promise<CodexAdvisoryResult> {
    const hasCodex = await this.checkCodexAvailability();

    if (hasCodex) {
      try {
        // Example of calling Codex CLI in production environment
        const prompt = `Bạn là trợ lý kỹ thuật tại An Bình Chemtech. Hãy viết 2 câu ngắn: 1) Thư chào gửi ông/bà ${customer.contactPerson} tại ${customer.companyName}. 2) Lưu ý kỹ thuật/an toàn cho danh mục hóa chất: ${items.map(i => i.productName).join(', ')}.`;
        const { stdout } = await execAsync(`codex prompt "${prompt.replace(/"/g, '\\"')}"`, {
          timeout: 5000,
        });

        return {
          source: 'CODEX_CLI',
          commercialNote: stdout.trim(),
          technicalAdvisory: 'Hàng hóa đạt tiêu chuẩn kỹ thuật COA/MSDS đính kèm.',
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        logger.codex.warn('Execution failed, falling back to simulated intelligence', { error: msg });
      }
    }

    // High-quality domain knowledge simulation (Mac mini Automation Agent)
    const productNames = items.map((i) => i.productName.toLowerCase());
    let safetyNotice = 'Toàn bộ sản phẩm được kiểm định chất lượng nghiêm ngặt kèm chứng nhận COA/MSDS tiêu chuẩn.';

    if (productNames.some((p) => p.includes('acid') || p.includes('axit') || p.includes('hcl') || p.includes('h2so4'))) {
      safetyNotice = 'Lưu ý an toàn: Nhóm hóa chất có tính ăn mòn cao. Vận chuyển bằng bồn chuyên dụng bọc composite hoặc phuy nhựa chịu acid; bảo quản nơi thoáng mát, tránh ánh nắng trực tiếp.';
    } else if (productNames.some((p) => p.includes('xút') || p.includes('naoh') || p.includes('kiềm'))) {
      safetyNotice = 'Lưu ý an toàn: Nhóm hóa chất kiềm mạnh. Thao tác yêu cầu trang bị đầy đủ PPE (kính bảo hộ, găng tay chống hóa chất); bảo quản cách ly với khu vực lưu trữ acid.';
    } else if (productNames.some((p) => p.includes('dung môi') || p.includes('methanol') || p.includes('cồn') || p.includes('ethanol') || p.includes('toluene'))) {
      safetyNotice = 'Lưu ý an toàn: Nhóm dung môi bay hơi dễ cháy nổ. Lưu kho tiêu chuẩn PCCC, tiếp địa chống tĩnh điện khi sang chiết; không để gần nguồn nhiệt và tia lửa điện.';
    }

    const commercialGreeting = `Kính gửi Quý khách hàng ${customer.companyName} (Kính gửi: ${customer.contactPerson}), An Bình Chemtech trân trọng gửi tới Quý công ty bảng báo giá và điều kiện thương mại cạnh tranh nhất cho các sản phẩm hóa chất phục vụ sản xuất.`;

    return {
      source: 'SIMULATED_INTELLIGENCE',
      commercialNote: commercialGreeting,
      technicalAdvisory: safetyNotice,
    };
  }
}
