import { Injectable, BadRequestException } from '@nestjs/common';
import Ajv from 'ajv';

@Injectable()
export class TemplateRenderService {
  private readonly ajv = new Ajv({ allErrors: true });

  validateInput(variables: Record<string, any>, inputSchema?: object) {
    if (!inputSchema) return;
    const validate = this.ajv.compile(inputSchema as any);
    const ok = validate(variables);
    if (!ok) {
      throw new BadRequestException({ message: 'Template input validation failed', errors: validate.errors });
    }
  }

  renderTemplate(template: string, variables: Record<string, any>, inputSchema?: object): string {
    this.validateInput(variables, inputSchema);
    return template.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_m, key) => {
      // support dot paths like a.b.c
      const value = key.split('.').reduce((acc: any, k: string) => (acc && acc[k] !== undefined ? acc[k] : undefined), variables);
      return value !== undefined && value !== null ? String(value) : '';
    });
  }
}


