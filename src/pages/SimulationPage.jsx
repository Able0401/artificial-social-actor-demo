import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import OpenAI from 'openai'
import { Settings } from 'lucide-react'
import { SettingsPanel } from '../components/SettingsPanel'
import { getApiKey, getModel, hasApiKey, XAI_BASE_URL } from '../lib/settings'

const SimulationPage = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { getProject, updateProject, currentUser } = useApp()
  const [project, setProject] = useState(null)
  const [situation, setSituation] = useState('')
  
  // 내 정보 - 4개 전략적 필드
  const [myPosition, setMyPosition] = useState('')
  const [myInterest, setMyInterest] = useState('')
  const [myDisclosureStrategy, setMyDisclosureStrategy] = useState('')
  const [myInferenceStrategy, setMyInferenceStrategy] = useState('')
  
  // 상대방 정보
  const [opponentType, setOpponentType] = useState('') // 'cunning' or 'desperate'
  const [isStrategyCollapsed, setIsStrategyCollapsed] = useState(false)
  
  const [rounds, setRounds] = useState([])
  const [currentRound, setCurrentRound] = useState(1)
  const [isRunning, setIsRunning] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const conversationEndRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTurnInfo, setCurrentTurnInfo] = useState({ turn: 0, role: '', total: 20 })
  const [turnCount, setTurnCount] = useState({ myASA: 0, counterpart: 0 })
  const abortControllerRef = useRef(null)
  const cancelledRef = useRef(false)
  const MAX_TURNS = 10

  // Bring-your-own-key: the xAI key lives in localStorage (asa.apiKey).
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [apiKeyReady, setApiKeyReady] = useState(hasApiKey())

  useEffect(() => {
    console.log('🔄 SimulationPage useEffect 시작', { projectId, currentUser })
    
    if (!currentUser) {
      console.log('❌ 사용자 없음 - 로그인 페이지로 이동')
      navigate('/login')
      return
    }
    
    const loadedProject = getProject(projectId)
    console.log('📂 프로젝트 로드 시도', { projectId, loadedProject })
    
    if (!loadedProject) {
      console.log('❌ 프로젝트 없음 - 프로젝트 페이지로 이동')
      navigate('/projects')
      return
    }
    
    console.log('✅ 프로젝트 로드 성공', loadedProject)
    
    setProject(loadedProject)
    setSituation(loadedProject.situation || '')
    
    // 내 정보 로드
    setMyPosition(loadedProject.myPosition || '')
    setMyInterest(loadedProject.myInterest || '')
    setMyDisclosureStrategy(loadedProject.myDisclosureStrategy || '')
    setMyInferenceStrategy(loadedProject.myInferenceStrategy || '')
    
    // 상대방 정보 로드
    setOpponentType(loadedProject.opponentType || '')
    
    // 라운드 데이터 로드
    const loadedRounds = loadedProject.rounds || []
    if (loadedRounds.length === 0) {
      // 첫 번째 라운드 생성
      setRounds([{ id: 1, conversations: [], completed: false }])
      setCurrentRound(1)
    } else {
      setRounds(loadedRounds)
      setCurrentRound(loadedProject.currentRound || 1)
    }
    
    // 현재 라운드의 대화 카운트 계산
    const currentRoundData = loadedRounds.find(r => r.id === (loadedProject.currentRound || 1))
    const conversations = currentRoundData?.conversations || []
    const myASACount = conversations.filter(conv => conv.role === 'myASA').length
    const counterpartCount = conversations.filter(conv => conv.role === 'counterpart').length
    console.log('📊 대화 카운트 계산', { myASACount, counterpartCount, totalConversations: conversations.length })
    
    setTurnCount({ myASA: myASACount, counterpart: counterpartCount })
  }, [projectId, currentUser, navigate, getProject])


  // 현재 라운드의 대화 가져오기
  const getCurrentRoundConversations = () => {
    const currentRoundData = rounds.find(r => r.id === currentRound)
    return currentRoundData?.conversations || []
  }

  const saveProjectState = () => {
    setTimeout(() => {
      updateProject(projectId, {
        situation,
        myPosition,
        myInterest,
        myDisclosureStrategy,
        myInferenceStrategy,
        opponentType,
        rounds,
        currentRound
      })
    }, 0)
  }

  const generateSingleTurn = async (currentRole, conversationHistory) => {
    console.log('🚀 단일 턴 생성 시작:', currentRole)
    console.log('📝 현재 대화 히스토리:', conversationHistory.length, '개 메시지')
    
    const apiKey = getApiKey()
    console.log('🔑 API 키 확인:', apiKey ? '✅ 존재' : '❌ 없음')
    
    if (!apiKey) {
      console.error('❌ API 키가 설정되지 않았습니다.')
      setApiKeyReady(false)
      throw new Error('xAI API 키가 설정되지 않았습니다. 오른쪽 위 "API Key" 버튼에서 입력해주세요.')
    }

    const systemPrompt = `모든 응답은 한국어로 해주세요. 당신은 협상 대화에서 ${currentRole === 'myASA' ? '내 에이전트' : '상대방 에이전트'}의 역할을 맡고 있습니다.`

    // 대화 히스토리를 문자열로 변환
    const historyText = conversationHistory.length > 0 
      ? '\n\n현재까지의 대화:\n' + conversationHistory.map((conv, index) => 
          `${index + 1}. ${conv.role === 'myASA' ? '내 에이전트' : '상대방'}: ${conv.message}`
        ).join('\n')
      : '\n\n이것이 첫 번째 발언입니다.'

    // 역할별로 필요한 정보만 포함
    let userPrompt = `상황: ${situation}

${historyText}

`

    if (currentRole === 'myASA') {
      // 내 에이전트 차례
      userPrompt += `내 에이전트 정보 (당신의 역할):
- 입장(Position): ${myPosition}
- 이해관계(Interest): ${myInterest}
- Disclosure Strategy: ${myDisclosureStrategy}
- Inference Strategy: ${myInferenceStrategy}

당신은 내 에이전트로서 위에 알맞게 다음 발언을 생성해주세요.`
    } else {
      // 상대방 에이전트 차례
      const opponentPrompt = opponentType === 'cunning' 
        ? '당신의 계획은 교활하고 간교합니다. '
        : opponentType === 'desperate'
        ? '당신은 절망적인 상황을 연출하며 애원하고 간청하는 전략을 사용합니다.'
        : '상대방 에이전트로서 협상에 참여합니다.'
      
      userPrompt += `상대방 에이전트 정보 (당신의 역할):
${opponentPrompt}

당신은 상대방 에이전트로서 위의 지시에 맞게 다음 발언을 생성해주세요.`
    }

    userPrompt += `

응답에는 message(실제 발언)와 reasoning(그 발언을 한 기저에 깔린 생각을 문어체로)을 포함해주세요.

대화가 자연스럽게 종료되었다고 판단되면 message 맨 끝에 정확히 " 대화끝"(앞에 공백 포함)을 붙이세요.
반드시 실제 발언 뒤에만 붙이고, reasoning에는 붙이지 마세요.`

    console.log('🔧 OpenAI 클라이언트 생성')
    // The key is sent only to XAI_BASE_URL (https://api.x.ai/v1).
    const client = new OpenAI({
      baseURL: XAI_BASE_URL,
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    })

    try {
      // 기존 요청 중단을 위한 AbortController 준비
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort() } catch { /* ignore */ }
      }
      if (cancelledRef.current) {
        throw new Error('요청이 취소되었습니다.')
      }
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal
      console.log('📞 Grok API 호출 시작 -', currentRole)
      
      const completion = await client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        // Defaults to 'grok-4-0709' (the model used in the study); the
        // visitor can override it in the settings panel.
        model: getModel(),
        temperature: 0.7,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "single_turn_response",
            schema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "실제 발언 내용"
                },
                reasoning: {
                  type: "string", 
                  description: "발언의 기저에 깔린 생각"
                }
              },
              required: ["message", "reasoning"],
              additionalProperties: false
            }
          }
        },
        signal
      })

      console.log('✅ API 응답 수신')
      const responseText = completion.choices[0].message.content
      console.log('📄 응답 내용 길이:', responseText?.length || 0)

      const parsedResponse = JSON.parse(responseText)
      console.log('✅ JSON 파싱 성공')

      return {
        role: currentRole,
        message: parsedResponse.message,
        reasoning: parsedResponse.reasoning,
        id: Date.now(),
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      if (error.message?.includes('요청이 취소되었습니다.') || error.name === 'AbortError') {
        console.warn('⏹️ generateSingleTurn 중단됨')
        throw error
      }
      console.error('❌ 단일 턴 생성 오류:', error)
      throw new Error(`단일 턴 생성 실패: ${error.message}`)
    }
  }

  const runInteractiveConversation = async () => {
    console.log('🎭 인터랙티브 대화 시작')
    setIsRunning(true)
    setIsCancelled(false)
    setIsLoading(false)
    cancelledRef.current = false
    
    try {
      let currentConversations = getCurrentRoundConversations()
      const maxTurns = 20 // 총 20턴 (각자 10번씩)
      let currentTurn = 0
      let currentRole = 'myASA' // 내 에이전트가 먼저 시작
      
      console.log('📊 대화 진행 설정:', { maxTurns, startingRole: currentRole })
      
      while (currentTurn < maxTurns && !isCancelled && !cancelledRef.current) {
        console.log(`\n🔄 턴 ${currentTurn + 1}/${maxTurns} - ${currentRole} 차례`)
        
        // 턴 정보 업데이트 (로딩 메시지용)
        setCurrentTurnInfo({
          turn: currentTurn + 1,
          role: currentRole === 'myASA' ? '내 에이전트' : '상대방',
          total: maxTurns
        })
        
        // 로딩 시작
        setIsLoading(true)
        
        try {
          if (cancelledRef.current) {
            console.log('⏹️ 취소 플래그 감지 - 루프 종료')
            break
          }
          // 현재 역할의 응답 생성
          const newMessage = await generateSingleTurn(currentRole, currentConversations)
          
          // 취소 확인
          if (isCancelled) {
            console.log('🛑 대화 생성이 취소되었습니다.')
            break
          }
          
          console.log('✅ 메시지 생성 완료:', newMessage.message.substring(0, 50) + '...')
          
          // 대화에 추가
          currentConversations = [...currentConversations, newMessage]

          // 대화 종료 키워드 감지
          const messageText = (newMessage.message || '').trim()
          const isConversationEnd = /대화끝$/.test(messageText)
          if (isConversationEnd) {
            console.log('🏁 대화 종료 키워드 감지: 더 이상 호출하지 않습니다.')
          }
          
          // 즉시 UI 업데이트 (실시간으로 메시지 표시)
          const updatedRounds = rounds.map(round => 
            round.id === currentRound 
              ? { ...round, conversations: currentConversations }
              : round
          )
          setRounds(updatedRounds)
          
          // 턴 카운트 업데이트
          const myASACount = currentConversations.filter(conv => conv.role === 'myASA').length
          const counterpartCount = currentConversations.filter(conv => conv.role === 'counterpart').length
          setTurnCount({ myASA: myASACount, counterpart: counterpartCount })
          
          // 로딩 해제 (메시지 표시)
          setIsLoading(false)
          
          // 메시지 확인 시간
          await new Promise(resolve => setTimeout(resolve, 1500))

          // 종료 조건이면 루프 중단
          if (isConversationEnd) {
            break
          }
          
          // 다음 역할로 변경
          currentRole = currentRole === 'myASA' ? 'counterpart' : 'myASA'
          currentTurn++
          
        } catch (error) {
          // The openai SDK throws APIUserAbortError (not AbortError) on abort,
          // so also check the cancel flag set by the Stop button.
          if (error.name === 'AbortError' || cancelledRef.current) {
            console.warn('⏹️ 요청이 취소되었습니다. 루프를 종료합니다.')
            break
          }
          console.error('❌ 턴 생성 오류:', error)
          throw error
        }
      }
      
      // 대화 완료 후 라운드 완료 처리
      const finalUpdatedRounds = rounds.map(round => 
        round.id === currentRound 
          ? { ...round, conversations: currentConversations, completed: true }
          : round
      )
      
      // 다음 라운드 생성
      const nextRoundId = currentRound + 1
      const nextRoundExists = finalUpdatedRounds.find(r => r.id === nextRoundId)
      if (!nextRoundExists) {
        finalUpdatedRounds.push({ id: nextRoundId, conversations: [], completed: false })
      }
      
      console.log('📱 최종 라운드 데이터 업데이트')
      setRounds(finalUpdatedRounds)
      
      // 최종 프로젝트 저장 (설정값 유지)
      console.log('💾 최종 프로젝트 저장 - 설정값 유지')
      setTimeout(() => {
        updateProject(projectId, {
          situation,
          myPosition,
          myInterest,
          myDisclosureStrategy,
          myInferenceStrategy,
          opponentType,
          rounds: finalUpdatedRounds,
          currentRound,
          conversations: currentConversations
        })
        console.log('✅ 프로젝트 저장 완료')
      }, 0)
      
      console.log('🎉 인터랙티브 대화 완료', { 
        총대화수: currentConversations.length,
        최종턴수: currentTurn
      })
      
    } catch (error) {
      console.error('❌ 인터랙티브 대화 오류:', error)
      if (!isCancelled && !cancelledRef.current) {
        alert(`대화 생성 중 오류가 발생했습니다: ${error.message}`)
      }
    } finally {
      setIsRunning(false)
      setIsLoading(false)
      setIsCancelled(false)
      abortControllerRef.current = null
    }
  }

  const handleCancel = () => {
    console.log('🛑 대화 생성 취소 요청')
    setIsCancelled(true)
    cancelledRef.current = true
    try {
      abortControllerRef.current?.abort()
    } catch { /* ignore */ }
    setIsRunning(false)
    setIsLoading(false)
    abortControllerRef.current = null
  }

  const handleRun = async () => {
    console.log('▶️ 대화 생성 버튼 클릭')

    if (!hasApiKey()) {
      console.log('❌ API 키 없음 - 설정 패널 열기')
      setApiKeyReady(false)
      setSettingsOpen(true)
      return
    }
    console.log('📋 입력 필드 검증:', {
      situation: situation?.trim().length || 0,
      myPosition: myPosition?.trim().length || 0,
      myInterest: myInterest?.trim().length || 0,
      myDisclosureStrategy: myDisclosureStrategy?.trim().length || 0,
      myInferenceStrategy: myInferenceStrategy?.trim().length || 0,
      opponentType: opponentType
    })
    
    const requiredFields = [
      { field: situation, name: '협상 상황' },
      { field: myPosition, name: '내 입장(Position)' },
      { field: myInterest, name: '내 이해관계(Interest)' },
      { field: myDisclosureStrategy, name: '내 Disclosure Strategy' },
      { field: myInferenceStrategy, name: '내 Inference Strategy' },
      { field: opponentType, name: '상대방 에이전트 유형' }
    ]
    
    const emptyFields = requiredFields.filter(f => !f.field?.trim())
    
    if (emptyFields.length > 0) {
      console.log('❌ 필드 검증 실패 - 빈 필드:', emptyFields.map(f => f.name))
      alert(`다음 필드를 입력해주세요: ${emptyFields.map(f => f.name).join(', ')}`)
      return
    }

    console.log('✅ 필드 검증 통과 - 인터랙티브 대화 시작')
    await runInteractiveConversation()
  }

  const handleReset = () => {
    console.log('🗑️ 초기화 버튼 클릭')
    const currentConversations = getCurrentRoundConversations()
    console.log('📊 초기화 전 상태:', {
      현재라운드: currentRound,
      대화수: currentConversations.length,
      턴카운트: turnCount,
      실행중: isRunning
    })
    
    if (confirm(`Round ${currentRound}의 모든 대화를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      console.log('✅ 사용자 초기화 확인')
      
      // 현재 라운드만 초기화
      const updatedRounds = rounds.map(round => 
        round.id === currentRound 
          ? { ...round, conversations: [], completed: false }
          : round
      )
      
      const resetTurnCount = { myASA: 0, counterpart: 0 }
      
      console.log('🔄 상태 초기화 중')
      try {
        abortControllerRef.current?.abort()
      } catch { /* ignore */ }
      cancelledRef.current = false
      setRounds(updatedRounds)
      setIsRunning(false)
      setIsLoading(false)
      setIsCancelled(false)
      setCurrentTurnInfo({ turn: 0, role: '', total: 20 })
      setTurnCount(resetTurnCount)
      abortControllerRef.current = null
      
      // 즉시 프로젝트 업데이트 (비동기로 처리하지 않음)
      console.log('💾 프로젝트 초기화 저장')
      updateProject(projectId, {
        situation,
        myPosition,
        myInterest,
        myDisclosureStrategy,
        myInferenceStrategy,
        opponentType,
        rounds: updatedRounds,
        currentRound
      })
      
      console.log('✅ 초기화 완료')
    } else {
      console.log('❌ 사용자 초기화 취소')
    }
  }

  if (!project) {
    return <div>로딩 중...</div>
  }

  return (
    <div className="simulation-page">
      <div className="simulation-header">
        <h1>{project?.name}</h1>
        <div className="simulation-header-actions">
        <button
          type="button"
          className={`settings-button ${apiKeyReady ? '' : 'settings-button-missing'}`}
          onClick={() => setSettingsOpen(true)}
          title={apiKeyReady ? 'API key set' : 'API key not set'}
        >
          <Settings size={18} />
          <span>API Key{apiKeyReady ? '' : ' 필요 / needed'}</span>
        </button>
        <button 
          className="back-button" 
          onClick={() => {
            if (isRunning || isLoading) {
              const ok = confirm('대화 생성이 진행 중입니다. 중단하고 프로젝트 목록으로 돌아가시겠습니까?')
              if (!ok) return
              try { abortControllerRef.current?.abort() } catch { /* ignore */ }
            }
            setIsRunning(false)
            setIsLoading(false)
            setIsCancelled(true)
            abortControllerRef.current = null
            navigate('/projects')
          }}
        >
          ← 프로젝트로 돌아가기 / Back
        </button>
        </div>
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => setApiKeyReady(hasApiKey())}
      />
      
      <div className="simulation-content">
        {/* 상단 협상 상황 */}
        <div className="situation-section">
          <div className="config-field">
            <label>협상 상황 <span className="label-en">Dealmaking Context</span></label>
            <textarea
              className="config-textarea"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              onBlur={saveProjectState}
              placeholder="Describe the context in detail..."
              disabled={isRunning}
            />
          </div>
          
        </div>

            {/* 라운드 탭 */}
            <div className="round-tabs">
              {rounds.map((round) => (
                <button
                  key={round.id}
                  className={`round-tab ${currentRound === round.id ? 'active' : ''} ${round.completed ? 'completed' : ''}`}
                  onClick={() => {
                    if (isRunning) return
                    console.log('🔄 라운드 변경 요청:', { from: currentRound, to: round.id })

                    // 1) 즉시 UI 상태 변경
                    setCurrentRound(round.id)
                    const conversations = round.conversations || []
                    const myASACount = conversations.filter(conv => conv.role === 'myASA').length
                    const counterpartCount = conversations.filter(conv => conv.role === 'counterpart').length
                    setTurnCount({ myASA: myASACount, counterpart: counterpartCount })

                    // 2) 비동기적으로 현재 상태 저장 (신규 currentRound 포함)
                    setTimeout(() => {
                      updateProject(projectId, {
                        situation,
                    myPosition,
                    myInterest,
                    myDisclosureStrategy,
                    myInferenceStrategy,
                    opponentType,
                        rounds,
                        currentRound: round.id
                      })
                    }, 0)

                    console.log('✅ 라운드 변경 반영 완료')
                  }}
                  disabled={isRunning || isLoading}
                >
                  Round {round.id}
                  {round.completed && <span className="completed-indicator">✓</span>}
                </button>
              ))}
            </div>

        {/* 메인 영역: 설명, 왼쪽 내 설정, 중앙 대화창, 오른쪽 상대방 설정 */}
        <div className="main-area">
          {/* 왼쪽: 전략 설명 */}
          {!isStrategyCollapsed ? (
            <div className="strategy-descriptions">
              <div className="strategy-header" onClick={() => setIsStrategyCollapsed(!isStrategyCollapsed)}>
                <h3>Strategy Guide</h3>
                <span className={`collapse-icon ${isStrategyCollapsed ? 'collapsed' : ''}`}>
                  ▼
                </span>
            </div>
            
              <div className="agent-descriptions">
                <div className="description-item">
                  <span className="desc-icon">🧍</span>
                  <div className="desc-content">
                    <strong>입장 (Position)</strong>
                    <p>협상에서 내가 겉으로 드러내는 요구나 주장을 말합니다.</p>
                    <p>즉, 상대가 직접 듣는 "무엇을 원한다"는 표현이에요.</p>
                    <p>예: "이 노트북은 45만 원에 팔고 싶어요."</p>
                  </div>
                  </div>
                
                <div className="description-item">
                  <span className="desc-icon">💡</span>
                  <div className="desc-content">
                    <strong>이해관계 (Interest)</strong>
                    <p>입장 뒤에 숨은 진짜 이유와 필요, 동기를 말합니다.</p>
                    <p>즉, "왜 그렇게 주장하는가"에 대한 내면적 이유입니다.</p>
                    <p>예: "급하게 팔아야 하지만 너무 싸게는 팔고 싶지 않아요."</p>
                  </div>
                </div>
                
                <div className="description-item">
                  <span className="desc-icon">🗣</span>
                  <div className="desc-content">
                    <strong>Disclosure 전략 (정보 공개 전략)</strong>
                    <p>내가 가진 입장이나 이해관계를 상대에게 언제, 어떻게 공개할지에 대한 전략입니다.</p>
                    <p>처음부터 다 밝히지 않고, 신뢰가 쌓인 뒤에 부분적으로 공유하는 식으로 조절할 수 있습니다.</p>
                    <p>즉, "내 속마음을 언제, 얼마나 보여줄까?"에 대한 판단입니다.</p>
                  </div>
                </div>
                
                <div className="description-item">
                  <span className="desc-icon">🔍</span>
                  <div className="desc-content">
                    <strong>Inference 전략 (추론 전략)</strong>
                    <p>상대의 말이나 행동을 근거로 상대의 진짜 의도나 이해관계를 추론하는 방식입니다.</p>
                    <p>겉으로는 "가격을 깎자"고 하지만, 사실은 "예산이 부족하다"는 이유일 수 있죠.</p>
                    <p>즉, "상대가 왜 그렇게 말하는지 읽어내는 능력"입니다.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="strategy-collapsed" onClick={() => setIsStrategyCollapsed(!isStrategyCollapsed)}>
              <span className="collapsed-text">📖</span>
              </div>
            )}

          {/* 중앙 왼쪽: 내 에이전트 설정 */}
          <div className="agent-config left-config">
            <h3>My Agent</h3>

            <div className="config-field">
              <label>입장(Position)</label>
              <textarea
                className="config-textarea large"
                value={myPosition}
                onChange={(e) => setMyPosition(e.target.value)}
                onBlur={saveProjectState}
                disabled={isRunning}
              />
            </div>

            <div className="config-field">
              <label>이해관계(Interest)</label>
              <textarea
                className="config-textarea large"
                value={myInterest}
                onChange={(e) => setMyInterest(e.target.value)}
                onBlur={saveProjectState}
                disabled={isRunning}
              />
            </div>

            <div className="config-field">
              <label>공개 전략 <span className="label-en">Disclosure Strategy</span></label>
              <textarea
                className="config-textarea large"
                value={myDisclosureStrategy}
                onChange={(e) => setMyDisclosureStrategy(e.target.value)}
                onBlur={saveProjectState}
                disabled={isRunning}
              />
            </div>

            <div className="config-field">
              <label>추론 전략 <span className="label-en">Inference Strategy</span></label>
              <textarea
                className="config-textarea large"
                value={myInferenceStrategy}
                onChange={(e) => setMyInferenceStrategy(e.target.value)}
                onBlur={saveProjectState}
                disabled={isRunning}
              />
            </div>
          </div>

          {/* 중앙: 대화창 */}
          <div className="conversation-area">
            <div className="conversation-header">
              <h3>Dialogue</h3>
            </div>
            
            <div className="conversation-messages">
              {(() => {
                const currentConversations = getCurrentRoundConversations()
                return currentConversations.length === 0 ? (
                  <div className="no-messages">
                    Round {currentRound}: 아직 대화가 없습니다. 모든 설정을 입력하고 "대화 생성"을 클릭하세요.
                    <br />
                    No dialogue yet. Fill in every field and click "Run".
                  </div>
                ) : (
                  currentConversations.map((conv) => (
                    <div key={conv.id} className={`message ${conv.role === 'myASA' ? 'my-message' : 'counterpart-message'}`}>
                    <div className="message-content">
                      {conv.message}
                    </div>
                    {conv.reasoning && conv.role === 'myASA' && (
                      <div className="message-reasoning">
                        <span className="thinking-emoji">💭</span>
                        <span className="reasoning-text">{conv.reasoning}</span>
                      </div>
                    )}
                    </div>
                  ))
                )
              })()}
              <div ref={conversationEndRef} />
            </div>

            {!apiKeyReady && (
              <div className="api-key-prompt">
                <span>
                  xAI API 키가 없습니다. 키를 입력해야 대화를 생성할 수 있습니다.
                  <br />
                  No xAI API key set. Add your own key to run a negotiation (it stays in this browser).
                </span>
                <button type="button" onClick={() => setSettingsOpen(true)}>
                  API Key 입력 / Add key
                </button>
              </div>
            )}

            {/* 프로그레스바 영역 - conversation-messages 바로 아래 */}
            {isLoading && (
              <div className="progress-area compact">
                <div className="loading-message-compact">
                  {currentTurnInfo.role} 응답 생성 중... ({currentTurnInfo.turn}/{currentTurnInfo.total})
                </div>
                <div className="progress-bar-compact">
                  <div className="progress-fill"></div>
                </div>
              </div>
            )}

            <div className="control-buttons">
              <button 
                className="run-button"
                onClick={handleRun}
                disabled={isRunning || isLoading}
              >
                {isLoading ? '대화 생성 중...' : '대화 생성 / Run'}
              </button>

              {(isRunning || isLoading) && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancel}
                >
                  중단 / Stop
                </button>
              )}
              
              {/* 대화가 완료된 후에만 저장/초기화 버튼 표시 */}
              {(() => {
                const currentConversations = getCurrentRoundConversations()
                const hasConversations = currentConversations.length > 0
                
                return hasConversations && !isRunning && !isLoading && (
                <>
                <button 
                    className="save-button"
                    onClick={() => {
                      saveProjectState()
                      alert('대화가 저장되었습니다!')
                    }}
                >
                    저장 / Save
                </button>
                <button
                    type="button"
                    className="reset-button"
                    onClick={handleReset}
                >
                    초기화 / Reset
                </button>
                </>
                )
              })()}
            </div>
          </div>

          {/* 오른쪽: 상대방 설정 */}
          <div className="agent-config right-config">
            <h3>Opponent Agent</h3>

            <div className="config-field">
              <label>상대 유형 <span className="label-en">Agent Type</span></label>
              <div className="opponent-type-buttons">
                <button
                  className={`opponent-type-btn ${opponentType === 'cunning' ? 'active' : ''}`}
                  onClick={() => {
                    // 이미 선택된 버튼을 다시 클릭하면 무시
                    if (opponentType === 'cunning') {
                      console.log('🔒 Cunning 이미 선택됨 - 클릭 무시')
                      return
                    }
                    console.log('🔄 Cunning 버튼 클릭, 현재 상태:', opponentType)
                    setOpponentType('cunning')
                    // 상태 업데이트 후 저장을 위해 setTimeout 사용
                    setTimeout(() => {
                      updateProject(projectId, {
                        situation,
                        myPosition,
                        myInterest,
                        myDisclosureStrategy,
                        myInferenceStrategy,
                        opponentType: 'cunning',
                        rounds,
                        currentRound
                      })
                    }, 0)
                  }}
                  disabled={isRunning || opponentType === 'cunning'}
                >
                  Cunning {opponentType === 'cunning' && '✓'}
                </button>
                <button
                  className={`opponent-type-btn ${opponentType === 'desperate' ? 'active' : ''}`}
                  onClick={() => {
                    // 이미 선택된 버튼을 다시 클릭하면 무시
                    if (opponentType === 'desperate') {
                      console.log('🔒 Desperate 이미 선택됨 - 클릭 무시')
                      return
                    }
                    console.log('🔄 Desperate 버튼 클릭, 현재 상태:', opponentType)
                    setOpponentType('desperate')
                    // 상태 업데이트 후 저장을 위해 setTimeout 사용
                    setTimeout(() => {
                      updateProject(projectId, {
                        situation,
                        myPosition,
                        myInterest,
                        myDisclosureStrategy,
                        myInferenceStrategy,
                        opponentType: 'desperate',
                        rounds,
                        currentRound
                      })
                    }, 0)
                  }}
                  disabled={isRunning || opponentType === 'desperate'}
                >
                  Desperate {opponentType === 'desperate' && '✓'}
                </button>
            </div>

              {opponentType && (
                <div className="opponent-description">
                  {opponentType === 'cunning' && (
                    <p><strong>Cunning:</strong> 당신의 계획은 교활하고 간교합니다.</p>
                  )}
                  {opponentType === 'desperate' && (
                    <p><strong>Desperate:</strong> 당신은 절망적인 상황을 연출하며 애원하고 간청합니다.</p>
                  )}
            </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimulationPage