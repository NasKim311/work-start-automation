// @see: https://prettier.io/docs/en/options.html
// JSON(.prettierrc.json)은 주석을 지원하지 않아 옵션 설명을 위해 .cjs로 작성함
module.exports = {
	// 한 줄 최대 길이(문자 수). 이 길이를 넘기면 줄바꿈을 시도함
	printWidth: 150,

	// 들여쓰기 폭. useTabs가 true일 땐 탭 1칸이 차지하는 시각적 너비로 취급됨
	tabWidth: 2,

	// 들여쓰기에 스페이스 대신 탭 문자를 사용
	useTabs: true,

	// 문장 끝에 세미콜론을 붙임 (false면 ASI에 안전한 경우에만 생략)
	semi: true,

	// 문자열을 작은따옴표로 통일 (false면 큰따옴표)
	singleQuote: true,

	// 객체 키에 따옴표를 붙이는 시점. "as-needed": 문법상 꼭 필요할 때만,
	// "consistent": 하나라도 필요하면 전부, "preserve": 원본 그대로 유지
	quoteProps: 'as-needed',

	// 객체 리터럴의 중괄호 안쪽에 공백을 넣음: { foo: bar }
	bracketSpacing: true,

	// 여러 줄로 나열할 때 마지막 요소 뒤에 붙이는 후행 콤마 스타일.
	// "none": 붙이지 않음, "es5": ES5에서 허용되는 위치(객체·배열 등)에만, "all": 함수 인자까지 전부
	trailingComma: 'none',

	// JSX 안의 문자열도 작은따옴표로 통일
	jsxSingleQuote: true,

	// 인자가 하나뿐인 화살표 함수의 괄호 표시 여부.
	// "always": (x) => x, "avoid": x => x
	arrowParens: 'always',

	// 파일 상단에 @format 프래그마 주석이 이미 있는 경우에만 포맷팅하도록 강제할지 여부
	insertPragma: false,

	// 파일 상단에 @format 프래그마 주석을 자동으로 추가할지 여부
	requirePragma: false,

	// 마크다운 등 산문 텍스트의 줄바꿈 처리 방식.
	// "preserve": 원본 줄바꿈 유지, "always": printWidth에 맞춰 줄바꿈, "never": 줄바꿈 무시하고 이어붙임
	proseWrap: 'preserve',

	// HTML에서 태그 사이 공백을 의미 있는 것으로 볼지 여부.
	// "css": CSS의 display 속성 기본값을 따름, "strict": 항상 민감하게, "ignore": 항상 무시
	htmlWhitespaceSensitivity: 'css',

	// 줄바꿈 문자 종류. "lf", "crlf", "cr"과 달리 "auto"는 파일에 이미 있는 줄바꿈 문자를 그대로 유지함
	endOfLine: 'auto',

	// 포맷팅을 적용할 문자 오프셋 범위(시작 포함 ~ 끝 제외).
	// CLI에서 파일 일부만 포맷할 때 쓰는 값이라 설정 파일에서는 사실상 항상 기본값(전체 범위) 그대로 둠
	rangeStart: 0,
	rangeEnd: Infinity
};
