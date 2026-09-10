import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { WidgetItem } from '../components/widget/WidgetItem';
import { TodoItem } from '../types';

describe('WidgetItem Rendering Test', () => {
  const sampleTodo: TodoItem = {
    id: 'todo_3',
    title: '每日饮水 2000ml',
    completed: false,
    type: 'daily_habit',
    priority: 'low',
    dueTime: '10:00',
    createdAt: '2026-09-07T14:56:57.817061600+08:00',
    targetDate: '2026-09-07',
  };

  it('renders title and priority correctly in HTML', () => {
    const html = renderToString(React.createElement(WidgetItem, { todo: sampleTodo }));
    console.log('HTML Output:', html);
    expect(html).toContain('每日饮水 2000ml');
  });
});
