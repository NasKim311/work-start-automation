export type TaskType = 'browser' | 'program';

export type Task = {
	type: TaskType;
	title?: string;
	value: string;
	delay: number;
	// 출근 시작하기/자동실행 시 이 작업을 건너뛸지 여부. 미지정(undefined)은
	// 켜진 것으로 취급 — 이 필드 도입 전 저장된 작업과의 하위 호환을 위함.
	enabled?: boolean;
};

export type Profile = {
	id: string;
	name: string;
	tasks: Task[];
};

// 요일별 자동실행 프로필. 0=일요일 ~ 6=토요일(JS Date.getDay()과 동일한 인덱스).
// 값이 profileId면 그 세트를 자동 실행, null이면 그 요일엔 자동 실행 안 함.
export type AutoStartByDay = Record<number, string | null>;

export type AppConfig = {
	profiles: Profile[];
	activeProfileId: string;
	autoStartByDay: AutoStartByDay;
};

export interface ElectronAPI {
	runTasks: (tasks: Task[]) => Promise<void>;
	runSingleTask: (task: Task) => Promise<void>;
	stopTasks: () => Promise<void>;
	saveConfig: (config: AppConfig) => Promise<void>;
	loadConfig: () => Promise<AppConfig>;
	selectFile: () => Promise<string | null>;
	exportConfig: (config: AppConfig) => Promise<boolean>;
	importConfig: () => Promise<AppConfig | null>;
	getAutoStart: () => Promise<boolean>;
	setAutoStart: (val: boolean) => Promise<void>;
	isAutoStart: () => Promise<boolean>;
	notifyDirtyState: (config: AppConfig, dirty: boolean) => void;
	onTaskError: (callback: (data: { task: Task; message: string }) => void) => () => void;
	onTaskStarted: (callback: (data: { task: Task; index: number; total: number }) => void) => () => void;
	onRunFinished: (callback: () => void) => () => void;
	onConfigLoadWarning: (callback: (data: { path: string; recovered: boolean; backupPath?: string | null }) => void) => () => void;
}
