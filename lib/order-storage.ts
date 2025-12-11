// Sistema simples de armazenamento de pedidos em memória
// Em produção, isso deveria ser um banco de dados

import { TrackingParameters } from '../hooks/useTrackingParams'

interface OrderData {
  orderId: string
  transactionId?: string
  amount: number
  gateway?: string // Gateway usado (ghostpay, ezzpag, umbrela, etc)
  customerData: {
    name: string
    email: string
    phone: string
    document: string
  }
  trackingParameters: TrackingParameters
  createdAt: string
  status: 'pending' | 'paid' | 'cancelled' | 'failed'
  paidAt?: string
  utmifySent?: boolean // Flag para evitar duplicação de conversões
  utmifyPaidSent?: boolean // Flag específica para status paid
}

// SOLUÇÃO: Usar globalThis para persistir entre hot-reloads do Next.js
// Isso garante que o storage não seja perdido durante desenvolvimento
declare global {
  var orderStorageMap: Map<string, OrderData> | undefined
}

// Armazenamento em memória (persistente entre hot-reloads)
const orderStorage = global.orderStorageMap || new Map<string, OrderData>()

// Salvar referência no global para persistir
if (!global.orderStorageMap) {
  global.orderStorageMap = orderStorage
}

export const orderStorageService = {
  // Salvar pedido
  saveOrder: (orderData: OrderData) => {
    orderStorage.set(orderData.orderId, orderData)
    
    // Se tiver transactionId, também indexar por ele
    if (orderData.transactionId) {
      orderStorage.set(orderData.transactionId, orderData)
    }
    
    console.log(`📦 [ORDER-STORAGE] Total de pedidos no storage: ${orderStorage.size}`)
    
    // Limpar pedidos antigos (mais de 24 horas)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    for (const [key, order] of orderStorage.entries()) {
      if (order.createdAt < oneDayAgo) {
        orderStorage.delete(key)
      }
    }
  },

  // Buscar pedido por orderId ou transactionId
  getOrder: (id: string): OrderData | null => {
    
    const order = orderStorage.get(id)
    if (order) {
      return order
    }
    
    return null
  },

  // Atualizar status do pedido
  updateOrderStatus: (id: string, status: OrderData['status']) => {
    const order = orderStorage.get(id)
    if (order) {
      order.status = status
      orderStorage.set(id, order)
      
      // Se tiver transactionId, também atualizar
      if (order.transactionId) {
        orderStorage.set(order.transactionId, order)
      }
      
      //console.log("[v0] Order Storage - Status updated:", order.orderId, status)
      return true
    }
    return false
  },

  // Listar todos os pedidos (para debug)
  getAllOrders: (): OrderData[] => {
    const orders = Array.from(orderStorage.values())
    // Remover duplicatas (quando indexado por orderId e transactionId)
    const uniqueOrders = orders.filter((order, index, self) => 
      index === self.findIndex(o => o.orderId === order.orderId)
    )
    return uniqueOrders
  },

  // Limpar armazenamento
  clear: () => {
    orderStorage.clear()
    //console.log("[v0] Order Storage - Cleared all orders")
  }
}

export type { OrderData }
