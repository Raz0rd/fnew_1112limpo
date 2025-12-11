import { NextRequest, NextResponse } from "next/server"
import headpicData from "../headpic.json"

interface AvatarData {
  Id: number
  Type: string
  collectionType: string
  name: string | null
  desc: string | null
  Icon: string
  Rare: string
  IsUnique: boolean
  IconInAB: string
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const headPicId = searchParams.get("headPicId")

    if (!headPicId) {
      return NextResponse.json(
        { error: "headPicId é obrigatório" },
        { status: 400 }
      )
    }

    // Converter para número para comparação
    const headPicIdNumber = parseInt(headPicId)

    // Buscar o avatar no JSON
    const avatar = (headpicData as AvatarData[]).find((item: AvatarData) => item.Id === headPicIdNumber)

    if (!avatar) {
      return NextResponse.json(
        { error: "Avatar não encontrado" },
        { status: 404 }
      )
    }

    // Retornar as informações do avatar
    return NextResponse.json({
      id: avatar.Id,
      name: avatar.name,
      icon: avatar.Icon,
      description: avatar.desc,
      rare: avatar.Rare,
      imageUrl: `https://freefiremobile-a.akamaihd.net/common/Local/PK/FF_UI_Icon/${avatar.Icon}.png`
    })

  } catch (error) {
    console.error("Erro ao buscar avatar:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
