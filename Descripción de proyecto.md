# AI-Director

> Un juego web interactivo con sistema adaptativo de dificultad dinámica

## 📋 Descripción del Proyecto

Este proyecto es un juego web interactivo inspirado en Left 4 Dead, desarrollado como parte de la asignatura **Programación de Sistemas Adaptativos**. El juego implementa un sistema adaptativo que ajusta la dificultad dinámicamente según el desempeño del jugador.

## 🎮 Sistema Adaptativo

- **Dificultad Dinámica**: El juego ajusta automáticamente la dificultad según el desempeño del jugador
- **Asistencia Inteligente**: Si el jugador entra en crisis (poca vida o munición), el sistema genera ayudas
- **Balance Automático**: Un "Director" controla la aparición de enemigos y recursos

## 📊 Evaluación del Jugador

El sistema evalúa constantemente al jugador en tres categorías:

| Nivel | Criterios |
|-------|-----------|
| **Alto desempeño** | Salud > 60% y energía > 25% |
| **Desempeño medio** | Salud > 30% |
| **Bajo desempeño** | Salud ≤ 30% o energía muy baja |