let chartInstance = null;
let chartImageUrl = null;

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', verificarRespostas);
    });
});

function verificarRespostas() {
    const selects = document.querySelectorAll('select');
    let todasRespondidas = true;
    
    selects.forEach(select => {
        if (!select.value) {
            todasRespondidas = false;
        }
    });
    
    const btn = document.getElementById('btnResultado');
    btn.disabled = !todasRespondidas;
    btn.classList.toggle('ativo', todasRespondidas);
}

async function calcularResultado() {
    const form = document.getElementById('discForm');
    const formData = new FormData(form);
    let resultado = {
        D: 0,
        I: 0,
        S: 0,
        C: 0
    };

    const perguntasD = ['q1', 'q2', 'q3'];
    const perguntasI = ['q4', 'q5', 'q6'];
    const perguntasS = ['q7', 'q8', 'q9'];
    const perguntasC = ['q10', 'q11', 'q12'];

    for (let [key, value] of formData.entries()) {
        const val = parseInt(value);
        
        if (perguntasD.includes(key)) resultado.D += val;
        else if (perguntasI.includes(key)) resultado.I += val;
        else if (perguntasS.includes(key)) resultado.S += val;
        else if (perguntasC.includes(key)) resultado.C += val;
    }

    const perfis = [
        { tipo: 'D', valor: resultado.D, nome: 'Dominância', cor: 'rgba(255, 99, 132, 0.7)', descricao: 'Pessoas com alta Dominância são diretas, decididas e focadas em resultados. São motivadas por desafios e gostam de controle.' },
        { tipo: 'I', valor: resultado.I, nome: 'Influência', cor: 'rgba(54, 162, 235, 0.7)', descricao: 'Pessoas com alta Influência são comunicativas, entusiasmadas e otimistas. Valorizam relacionamentos e reconhecimento.' },
        { tipo: 'S', valor: resultado.S, nome: 'Estabilidade', cor: 'rgba(75, 192, 192, 0.7)', descricao: 'Pessoas com alta Estabilidade são pacientes, consistentes e cooperativas. Buscam segurança e harmonia no ambiente.' },
        { tipo: 'C', valor: resultado.C, nome: 'Conformidade', cor: 'rgba(255, 206, 86, 0.7)', descricao: 'Pessoas com alta Conformidade são analíticas, precisas e sistemáticas. Valorizam qualidade e precisão no trabalho.' }
    ];

    perfis.sort((a, b) => b.valor - a.valor);
    const perfilPredominante = perfis[0];

    document.getElementById('resultado').innerHTML = `
        <h2>Seu Resultado DISC</h2>
        <p><strong>${perfilPredominante.nome} (${perfilPredominante.tipo}): ${perfilPredominante.valor} pontos</strong></p>
        <div class="perfil-descricao">${perfilPredominante.descricao}</div>
        
        <h3 style="margin-top: 20px;">Pontuação Completa:</h3>
        <p>Dominância (D): ${resultado.D} pontos</p>
        <p>Influência (I): ${resultado.I} pontos</p>
        <p>Estabilidade (S): ${resultado.S} pontos</p>
        <p>Conformidade (C): ${resultado.C} pontos</p>
        
        <div class="botoes-resultado">
            <button type="button" id="btnPDF" onclick="gerarPDF()">Baixar Resultado em PDF</button>
        </div>
    `;

    if (chartInstance) {
        chartInstance.destroy();
    }

    const ctx = document.getElementById('grafico').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: perfis.map(p => p.nome),
            datasets: [{
                label: 'Pontuação',
                data: perfis.map(p => p.valor),
                backgroundColor: perfis.map(p => p.cor),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 12,
                    title: {
                        display: true,
                        text: 'Pontuação'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Perfil Comportamental'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} pontos`;
                        }
                    }
                }
            }
        }
    });

    // Converter gráfico para imagem
    chartImageUrl = await getChartImage();
    document.getElementById('btnPDF').style.display = 'block';
}

function getChartImage() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const canvas = document.getElementById('grafico');
            resolve(canvas.toDataURL('image/png'));
        }, 500);
    });
}

async function gerarPDF() {
    const btnPDF = document.getElementById('btnPDF');
    btnPDF.disabled = true;
    btnPDF.textContent = 'Gerando PDF...';
    
    // Criar um clone do conteúdo para o PDF
    const element = document.getElementById('contentToPrint');
    const clone = element.cloneNode(true);
    
    // Substituir o canvas pela imagem no clone
    const canvas = clone.querySelector('canvas');
    if (canvas && chartImageUrl) {
        const img = document.createElement('img');
        img.src = chartImageUrl;
        img.style.width = '100%';
        img.style.height = 'auto';
        canvas.parentNode.replaceChild(img, canvas);
    }
    
    // Esconder o botão de PDF no clone
    const btnClone = clone.querySelector('#btnPDF');
    if (btnClone) {
        btnClone.style.display = 'none';
    }
    
    const opt = {
        margin: 10,
        filename: 'Resultado_DISC.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            logging: true,
            useCORS: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    };

    try {
        await html2pdf().set(opt).from(clone).save();
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
    } finally {
        btnPDF.disabled = false;
        btnPDF.textContent = 'Baixar Resultado em PDF';
    }
}