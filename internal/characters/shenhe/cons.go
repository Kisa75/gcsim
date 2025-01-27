package shenhe

import (
	"github.com/genshinsim/gcsim/pkg/core/attributes"
	"github.com/genshinsim/gcsim/pkg/core/combat"
	"github.com/genshinsim/gcsim/pkg/core/glog"
	"github.com/genshinsim/gcsim/pkg/core/player/character"
	"github.com/genshinsim/gcsim/pkg/modifier"
)

const c4BuffKey = "shenhe-c4"

func (c *char) c2(active *character.CharWrapper, dur int) {
	active.AddAttackMod(character.AttackMod{
		Base: modifier.NewBaseWithHitlag("shenhe-c2", dur),
		Amount: func(ae *combat.AttackEvent, _ combat.Target) ([]float64, bool) {
			if ae.Info.Element != attributes.Cryo {
				return nil, false
			}
			return c.c2buff, true
		},
	})
}

// When characters under the effect of Icy Quill applied by Shenhe trigger its DMG Bonus effects, Shenhe will gain a Skyfrost Mantra stack:
//
// - When Shenhe uses Spring Spirit Summoning, she will consume all stacks of Skyfrost Mantra, increasing the DMG of that Spring Spirit Summoning by 5% for each stack consumed.
//
// - Max 50 stacks. Stacks last for 60s.
func (c *char) c4() float64 {
	if c.Base.Cons < 4 {
		return 0
	}
	if !c.StatusIsActive(c4BuffKey) {
		c.c4count = 0
		return 0
	}
	dmgBonus := 0.05 * float64(c.c4count)
	c.Core.Log.NewEvent("shenhe-c4 adding dmg bonus", glog.LogCharacterEvent, c.Index).
		Write("stacks", c.c4count).
		Write("dmg_bonus", dmgBonus)
	c.c4count = 0
	c.DeleteStatus(c4BuffKey)
	return dmgBonus
}

// C4 stacks are gained after the damage has been dealt and not before
// https://library.keqingmains.com/evidence/characters/cryo/shenhe?q=shenhe#c4-insight
func (c *char) c4CB(a combat.AttackCB) {
	//reset stacks to zero if all expired
	if !c.StatusIsActive(c4BuffKey) {
		c.c4count = 0
	}
	if c.c4count < 50 {
		c.c4count++
		c.Core.Log.NewEvent("shenhe-c4 stack gained", glog.LogCharacterEvent, c.Index).
			Write("stacks", c.c4count)
	}
	c.AddStatus(c4BuffKey, 3600, true) // 60 s
}
