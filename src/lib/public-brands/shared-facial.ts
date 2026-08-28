import type { FacialGuidelinesCopy } from "@/lib/public-brands/types";

export function buildFacialGuidelinesCopy(
    appName: string,
): FacialGuidelinesCopy {
    return {
        title: "Orientações para captura facial",
        subtitle: "Captura de face para leitores faciais",
        intro: `Siga estas orientações para garantir o melhor reconhecimento nos leitores da escola. Uma foto ruim não só impede o seu acesso — também prejudica o cadastro de outras pessoas no ${appName}.`,
        idealHeading: "Exemplos ideais",
        inadequateHeading: "Exemplos inadequados",
        practicesHeading: "Boas práticas",
        tipsHeading: "Dicas importantes",
        footerNote:
            "Seguir estas orientações aumenta significativamente a precisão do reconhecimento facial e evita rejeições durante o cadastro.",
        idealExamples: [
            {
                id: "frontal",
                kind: "ideal",
                title: "Frontal",
                description:
                    "Rosto de frente para a câmera, da cabeça aos ombros, olhos abertos.",
                src: "/orientacoes-facial/ideal-frontal.jpg",
                alt: "Retrato frontal correto, com o rosto centralizado e olhando para a câmera",
            },
            {
                id: "olhar-direto",
                kind: "ideal",
                title: "Olhar direto",
                description:
                    "Olhe diretamente para a lente. Pupilas e íris devem estar visíveis.",
                src: "/orientacoes-facial/ideal-olhar-direto.jpg",
                alt: "Retrato correto com o olhar voltado diretamente para a câmera",
            },
            {
                id: "expressao",
                kind: "ideal",
                title: "Expressão neutra",
                description:
                    "Expressão natural ou um leve sorriso, sem abrir a boca.",
                src: "/orientacoes-facial/ideal-expressao.jpg",
                alt: "Retrato correto com expressão neutra e leve sorriso",
            },
        ],
        inadequateExamples: [
            {
                id: "olhar-lado",
                kind: "inadequate",
                title: "Olhar para o lado",
                description: "O olhar deve estar na câmera, não para o lado.",
                src: "/orientacoes-facial/inadequado-olhar-lado.jpg",
                alt: "Retrato inadequado com a pessoa olhando para o lado",
            },
            {
                id: "angulo-baixo",
                kind: "inadequate",
                title: "Ângulo de baixo",
                description:
                    "Não incline o celular para cima. Mantenha a câmera na altura dos olhos.",
                src: "/orientacoes-facial/inadequado-angulo-baixo.jpg",
                alt: "Retrato inadequado capturado de baixo para cima",
            },
            {
                id: "angulo-excessivo",
                kind: "inadequate",
                title: "Ângulo excessivo",
                description:
                    "Evite perfil ou rosto virado. A face precisa estar de frente.",
                src: "/orientacoes-facial/inadequado-angulo-excessivo.jpg",
                alt: "Retrato inadequado com o rosto virado de perfil",
            },
            {
                id: "sombra",
                kind: "inadequate",
                title: "Sombra no rosto",
                description:
                    "Sombras nos olhos ou no rosto escondem traços usados pelo leitor.",
                src: "/orientacoes-facial/inadequado-sombra.jpg",
                alt: "Retrato inadequado com sombras fortes no rosto",
            },
            {
                id: "luz-fundo",
                kind: "inadequate",
                title: "Luz de fundo",
                description:
                    "Não fique de costas para janela ou lâmpada forte. O rosto fica escuro.",
                src: "/orientacoes-facial/inadequado-luz-fundo.jpg",
                alt: "Retrato inadequado com contraluz deixando o rosto escuro",
            },
            {
                id: "desfocada",
                kind: "inadequate",
                title: "Imagem desfocada",
                description:
                    "A foto precisa estar nítida. Fique imóvel até a captura terminar.",
                src: "/orientacoes-facial/inadequado-desfocada.jpg",
                alt: "Retrato inadequado desfocado e sem nitidez",
            },
            {
                id: "cabelo",
                kind: "inadequate",
                title: "Cabelo no rosto",
                description:
                    "Prenda o cabelo ou coloque atrás das orelhas. Testa, olhos e orelhas visíveis.",
                src: "/orientacoes-facial/inadequado-cabelo.jpg",
                alt: "Retrato inadequado com cabelo cobrindo parte do rosto",
            },
            {
                id: "expressao-exagerada",
                kind: "inadequate",
                title: "Expressão exagerada",
                description:
                    "Não sorria de boca aberta nem faça careta. Expressão neutra funciona melhor.",
                src: "/orientacoes-facial/inadequado-expressao.jpg",
                alt: "Retrato inadequado com sorriso exagerado de boca aberta",
            },
            {
                id: "oculos",
                kind: "inadequate",
                title: "Óculos com reflexo",
                description:
                    "Evite óculos escuros e reflexo nas lentes. Os olhos precisam aparecer.",
                src: "/orientacoes-facial/inadequado-oculos.jpg",
                alt: "Retrato inadequado com reflexo nos óculos cobrindo os olhos",
            },
            {
                id: "iluminacao",
                kind: "inadequate",
                title: "Iluminação desigual",
                description:
                    "A luz deve iluminar os dois lados do rosto de forma uniforme.",
                src: "/orientacoes-facial/inadequado-iluminacao.jpg",
                alt: "Retrato inadequado com um lado do rosto iluminado e o outro na sombra",
            },
        ],
        practices: [
            {
                icon: "sun",
                title: "Ambiente bem iluminado",
                description:
                    "Use luz frontal e uniforme, de preferência natural, sem sombras no rosto.",
            },
            {
                icon: "user",
                title: "Posição de frente",
                description:
                    "Fique de frente para a câmera, imóvel, da cabeça aos ombros.",
            },
            {
                icon: "eye",
                title: "Olhar na câmera",
                description:
                    "Olhe diretamente para a lente, com os olhos abertos e visíveis.",
            },
            {
                icon: "scan-face",
                title: "Rosto centralizado",
                description:
                    "Mantenha o rosto no centro do quadro. Apenas uma pessoa na foto.",
            },
            {
                icon: "ban",
                title: "Sem acessórios no rosto",
                description:
                    "Retire máscara, boné, chapéu e óculos escuros antes da captura.",
            },
            {
                icon: "smile",
                title: "Expressão neutra",
                description:
                    "Use expressão natural ou um leve sorriso, sem abrir a boca.",
            },
            {
                icon: "scissors",
                title: "Cabelo fora do rosto",
                description:
                    "Prenda o cabelo ou coloque atrás das orelhas. Testa e orelhas visíveis.",
            },
            {
                icon: "aperture",
                title: "Imagem nítida",
                description:
                    "A foto precisa estar focada. Não se mexa até a captura terminar.",
            },
        ],
        tips: [
            {
                title: "Distância ideal",
                description:
                    "Fique entre 40 e 80 cm da câmera — cerca de meio metro. Nem colado, nem longe demais.",
            },
            {
                title: "Fundo neutro",
                description:
                    "Prefira uma parede lisa e clara. Evite pessoas, plantas ou objetos atrás de você.",
            },
            {
                title: "Remova o que cobre o rosto",
                description:
                    "Óculos escuros, boné, chapéu e máscara prejudicam o cadastro e o reconhecimento no leitor.",
            },
        ],
    };
}
