import { describe, expect, it } from 'vitest';
import { formatTaskTitle } from '../components/pet/PetSpeechBubble';

describe('formatTaskTitle', () => {
  it('keeps short task titles unchanged', () => {
    expect(formatTaskTitle('完成周报')).toBe('完成周报');
  });

  it('adds a single ellipsis only when the title is truncated', () => {
    expect(formatTaskTitle('完成本周工作总结报告并发送给项目组', 10)).toBe('完成本周工作总结报告…');
  });
});
