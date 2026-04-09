import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'

import { AppLoader } from '@/components/common/AppLoader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { MessageComposer } from '@/components/messages/MessageComposer'
import type { Conversation, ConversationMessage } from '@/types/domain'
import { formatDate } from '@/utils/format'
import {
  resolveConversationProductImage,
  resolveConversationProductImageFallback,
  swapImageToFallback,
} from '@/utils/media'
import { getProductPath } from '@/utils/productRef'

import styles from '@/components/messages/MessagesInbox.module.scss'

interface ConversationViewProps {
  conversation: Conversation | null
  currentUserId: string
  messages: ConversationMessage[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  sending: boolean
  onSend: (body: string) => Promise<boolean>
}

const getCounterpartyLabel = (conversation: Conversation, currentUserId: string) => {
  if (conversation.buyerId === currentUserId) {
    return conversation.sellerStoreName || conversation.sellerName
  }
  return conversation.buyerName
}

export const ConversationView = ({
  conversation,
  currentUserId,
  messages,
  status,
  error,
  sending,
  onSend,
}: ConversationViewProps) => {
  const messagesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (status !== 'succeeded') {
      return
    }

    const node = messagesRef.current
    if (!node) {
      return
    }

    node.scrollTop = node.scrollHeight
  }, [conversation?.id, messages, status])

  if (!conversation) {
    return (
      <div className={styles.emptyState}>
        <h3>Выберите диалог</h3>
        <p>
          Откройте переписку из списка слева, чтобы читать и отправлять сообщения по
          товару.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.threadShell}>
      <div className={styles.threadHeader}>
        <div className={styles.threadProduct}>
          <img
            src={resolveConversationProductImage(conversation)}
            alt={conversation.productName}
            className={styles.threadProductImage}
            onError={(event) =>
              swapImageToFallback(
                event.currentTarget,
                resolveConversationProductImageFallback(conversation),
              )
            }
          />
          <div className={styles.threadTitle}>
            <span className={styles.threadTag}>Товар</span>
            <h2>{conversation.productName}</h2>
            <p>{getCounterpartyLabel(conversation, currentUserId)}</p>
          </div>
        </div>

        <Link to={getProductPath({ id: conversation.productId })} className="action-secondary">
          Открыть товар
        </Link>
      </div>

      {status === 'loading' ? <AppLoader label="Загружаем сообщения..." /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      {status !== 'loading' && !error ? (
        <div className={styles.messages} ref={messagesRef}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>Пока без сообщений</h3>
              <p>Диалог уже открыт. Можно отправить первое сообщение прямо сейчас.</p>
            </div>
          ) : (
            messages.map((message) => {
              const isMine = message.senderId === currentUserId

              return (
                <div
                  key={message.id}
                  className={clsx(
                    styles.messageRow,
                    isMine ? styles.messageMine : styles.messageOther,
                  )}
                >
                  <div className={clsx(styles.messageBubble, isMine && styles.messageMineBubble)}>
                    <p className={styles.messageBody}>{message.body}</p>
                    <span className={styles.messageMeta}>{formatDate(message.createdAt)}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : null}

      <MessageComposer
        sending={sending}
        onSend={onSend}
        placeholder={
          conversation.buyerId === currentUserId
            ? 'Напишите продавцу по этому товару...'
            : 'Ответьте покупателю по этому товару...'
        }
      />
    </div>
  )
}
