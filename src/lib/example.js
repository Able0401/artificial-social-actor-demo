// The scenario a first-time visitor lands on. One per UI language.

export const EXAMPLE = {
  en: {
    name: 'Example: selling a used laptop',
    situation:
      'A used-laptop sale on a second-hand marketplace. My agent is the seller; the opponent is a buyer who messaged about the listing. The laptop is a 2022 MacBook Air (M2, 8 GB, 256 GB) with 89% battery health and a small dent on one corner. Similar listings sell for 650 to 750 USD.',
    myPosition: 'Asking 720 USD. Will not go below 640 USD.',
    myInterest:
      'I move abroad in two weeks and need the money before then. Selling a little cheaper is better than not selling at all.',
    myDisclosureStrategy:
      'Do not mention the move or the deadline. If asked about the dent, answer honestly. Offer the original box and charger before offering a lower price.',
    myInferenceStrategy:
      'If the buyer mentions other offers, ask for specifics before believing them. If the buyer keeps pointing at the dent or the battery, read it as a push for a discount.',
    opponentType: 'cunning'
  },
  ko: {
    name: '예시: 중고 노트북 팔기',
    situation:
      '중고거래 앱에서 노트북을 파는 상황입니다. 내 에이전트는 판매자, 상대 에이전트는 글을 보고 연락한 구매자입니다. 물건은 2022년형 맥북 에어(M2, 8GB, 256GB)이고 배터리 성능 89%, 모서리에 작은 찍힘이 있습니다. 비슷한 매물은 85만~95만 원에 거래됩니다.',
    myPosition: '95만 원에 팔고 싶다. 83만 원 밑으로는 팔지 않는다.',
    myInterest: '2주 뒤 해외로 이사해서 그 전에 돈이 필요하다. 조금 싸게 파는 것이 못 파는 것보다 낫다.',
    myDisclosureStrategy:
      '이사나 일정은 말하지 않는다. 찍힘에 대해 물으면 솔직하게 답한다. 가격을 내리기 전에 원래 박스와 충전기를 덤으로 제안한다.',
    myInferenceStrategy:
      '구매자가 다른 매물을 언급하면 구체적으로 물어본 뒤 믿는다. 찍힘이나 배터리를 계속 지적하면 가격을 깎으려는 신호로 읽는다.',
    opponentType: 'cunning'
  }
}

export const exampleFields = (lang) => {
  const { name: _name, ...fields } = EXAMPLE[lang] || EXAMPLE.en
  return fields
}
