import { describe, it, expect } from 'vitest';
import { formatDelay, secondsToDisplay, displayToSeconds, reorderTasks } from './utils';
import type { Task } from './types';

describe('formatDelay', () => {
	it('초 단위는 그대로 표시한다', () => {
		expect(formatDelay(0)).toBe('0초');
		expect(formatDelay(45)).toBe('45초');
	});

	it('60의 배수가 아니면 초로 표시한다 (분으로 딱 안 떨어짐)', () => {
		expect(formatDelay(90)).toBe('90초');
	});

	it('60의 배수는 분으로 표시한다', () => {
		expect(formatDelay(60)).toBe('1분');
		expect(formatDelay(300)).toBe('5분');
	});
});

describe('secondsToDisplay / displayToSeconds', () => {
	it('초 단위는 값을 그대로 왕복한다', () => {
		expect(secondsToDisplay(45, 'sec')).toBe(45);
		expect(displayToSeconds(45, 'sec')).toBe(45);
	});

	it('분 단위는 60을 곱하고 나눈다', () => {
		expect(secondsToDisplay(300, 'min')).toBe(5);
		expect(displayToSeconds(5, 'min')).toBe(300);
	});

	it('분 단위 입력은 초로 반올림해서 저장한다', () => {
		expect(displayToSeconds(1.5, 'min')).toBe(90);
	});
});

describe('reorderTasks', () => {
	const makeTasks = (titles: string[]): Task[] => titles.map((title) => ({ type: 'browser', title, value: title, delay: 0 }));

	it('뒤에서 앞으로 옮기면 사이 항목들이 한 칸씩 밀린다', () => {
		const result = reorderTasks(makeTasks(['a', 'b', 'c']), 2, 0);
		expect(result.map((t) => t.title)).toEqual(['c', 'a', 'b']);
	});

	it('앞에서 뒤로 옮기면 사이 항목들이 한 칸씩 당겨진다', () => {
		const result = reorderTasks(makeTasks(['a', 'b', 'c']), 0, 2);
		expect(result.map((t) => t.title)).toEqual(['b', 'c', 'a']);
	});

	it('인접한 이동은 스왑과 동일한 결과를 낸다 (위/아래 버튼 케이스)', () => {
		const result = reorderTasks(makeTasks(['a', 'b', 'c']), 1, 0);
		expect(result.map((t) => t.title)).toEqual(['b', 'a', 'c']);
	});

	it('원본 배열을 변경하지 않는다', () => {
		const original = makeTasks(['a', 'b', 'c']);
		reorderTasks(original, 0, 2);
		expect(original.map((t) => t.title)).toEqual(['a', 'b', 'c']);
	});
});
