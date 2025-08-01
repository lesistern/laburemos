import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
  private readonly saltRounds: number;

  constructor(private configService: ConfigService) {
    this.saltRounds = this.configService.get<number>('security.bcryptRounds', 12);
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      this.logger.error('Failed to hash password:', error);
      throw new BadRequestException('Failed to process password');
    }
  }

  /**
   * Compare a plain password with a hashed password
   */
  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      this.logger.error('Failed to compare passwords:', error);
      return false;
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): void {
    const minLength = this.configService.get<number>('security.passwordMinLength', 8);
    
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    if (password.length < minLength) {
      throw new BadRequestException(`Password must be at least ${minLength} characters long`);
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password',
      '123456',
      '12345678',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      throw new BadRequestException('Password is too common. Please choose a stronger password');
    }

    // Check for sequential characters
    if (this.hasSequentialChars(password)) {
      throw new BadRequestException('Password should not contain sequential characters');
    }

    // Check for repeated characters
    if (this.hasRepeatedChars(password)) {
      throw new BadRequestException('Password should not contain too many repeated characters');
    }
  }

  /**
   * Generate a secure random password
   */
  generateSecurePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';

    // Ensure at least one character from each category
    password += this.getRandomChar(lowercase);
    password += this.getRandomChar(uppercase);
    password += this.getRandomChar(numbers);
    password += this.getRandomChar(symbols);

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += this.getRandomChar(allChars);
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Calculate password strength score
   */
  calculatePasswordStrength(password: string): {
    score: number;
    level: 'weak' | 'fair' | 'good' | 'strong';
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (password.length >= 8) score += 25;
    else feedback.push('Use at least 8 characters');

    if (password.length >= 12) score += 25;
    else if (password.length >= 8) feedback.push('Consider using 12+ characters for better security');

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 10;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 10;
    else feedback.push('Add uppercase letters');

    if (/\d/.test(password)) score += 10;
    else feedback.push('Add numbers');

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 20;
    else feedback.push('Add special characters');

    // Avoid common patterns
    if (!this.hasSequentialChars(password)) score += 5;
    else feedback.push('Avoid sequential characters (123, abc)');

    if (!this.hasRepeatedChars(password)) score += 5;
    else feedback.push('Avoid repeated characters');

    // Determine level
    let level: 'weak' | 'fair' | 'good' | 'strong';
    if (score < 40) level = 'weak';
    else if (score < 60) level = 'fair';
    else if (score < 80) level = 'good';
    else level = 'strong';

    return { score, level, feedback };
  }

  /**
   * Check if password contains sequential characters
   */
  private hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
    ];

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const substr = sequence.substring(i, i + 3);
        if (password.toLowerCase().includes(substr)) {
          return true;
        }
        // Check reverse sequence
        if (password.toLowerCase().includes(substr.split('').reverse().join(''))) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if password has too many repeated characters
   */
  private hasRepeatedChars(password: string): boolean {
    // Check for 3 or more consecutive identical characters
    return /(.)\1{2,}/.test(password);
  }

  /**
   * Get a random character from a string
   */
  private getRandomChar(chars: string): string {
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }

  /**
   * Check if two passwords are similar
   */
  arePasswordsSimilar(password1: string, password2: string): boolean {
    // Simple similarity check - you might want to implement more sophisticated algorithms
    const similarity = this.calculateSimilarity(password1.toLowerCase(), password2.toLowerCase());
    return similarity > 0.8; // 80% similarity threshold
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}