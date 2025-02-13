import React, { useState, useRef, useEffect } from "react"
import { graphql } from "gatsby"
import _ from "lodash"

import Layout from "../components/layout"
import Seo from "../components/seo"
import { loadCategoryStats, joinPeopleVotelog, peopleSlug } from "../utils"
import StackedBarChart from "../components/stackedBarChart"
import { OfficialWebsite, InOfficeDate } from "../components/profile"
import PeopleCardMini from "../components/peopleCardMini"
import PeopleCard from "../components/peopleCard"
import VoteLogCard from "../components/voteLogCard"
import ArrowDownOutlined from "@ant-design/icons/ArrowDownOutlined"
import CardGrid from "../components/cardGrid"

import "../styles/profile-book.css"

export const query = graphql`
  query($slug: String!, $party: String!) {
    party: partyYaml(
      party_type: { eq: "พรรค" }
      fields: { slug: { eq: $slug } }
    ) {
      yamlId
      name
      en {
        name
      }
      description
      established_date
      dissolved_date
      color
      party_group
      party_leader
      party_secretary
      website
      facebook
      twitter
      is_active
    }
    allPeopleYaml(filter: { party: { eq: $party } }) {
      totalCount
      edges {
        node {
          yamlId
          fields {
            slug
          }
          title
          name
          lastname
          party
          party_group
          mp_type
          mp_province
          mp_zone
          mp_list
          is_active
          is_mp
          images {
            url
          }
          people_party_history {
            party {
              id
            }
          }
        }
      }
    }
    mp_type: allPeopleYaml(
      filter: { is_mp: { eq: true }, party: { eq: $party } }
    ) {
      group(field: { mp_type: SELECT }) {
        value: totalCount
        name: fieldValue
      }
    }
    gender: allPeopleYaml(
      filter: { is_mp: { eq: true }, party: { eq: $party } }
    ) {
      group(field: { gender: SELECT }) {
        value: totalCount
        name: fieldValue
      }
    }
    education: allPeopleYaml(
      filter: { is_mp: { eq: true }, party: { eq: $party } }
    ) {
      group(field: { education: SELECT }) {
        value: totalCount
        name: fieldValue
      }
    }
    occupation_group: allPeopleYaml(
      filter: { is_mp: { eq: true }, party: { eq: $party } }
    ) {
      group(field: { occupation_group: SELECT }) {
        value: totalCount
        name: fieldValue
      }
    }
    age: allPeopleYaml(filter: { is_mp: { eq: true }, party: { eq: $party } }) {
      edges {
        node {
          birthdate
        }
      }
    }
    asset: allPeopleYaml(
      filter: { is_mp: { eq: true }, party: { eq: $party } }
    ) {
      edges {
        node {
          asset
        }
      }
    }
    allVotelogYaml(sort: { vote_date: DESC }) {
      totalCount
      edges {
        node {
          yamlId
          fields {
            slug
          }
          title
          description_th
          passed
          vote_date
        }
      }
    }
    allPeopleVoteYaml {
      edges {
        node {
          yamlId
          votelog {
            key
            value
          }
        }
      }
    }
  }
`

const cssH1 = {
  fontSize: "4rem",
}

const cssSection = {
  paddingTop: "3rem",
  paddingBottom: "8rem",
  h2: {
    fontSize: "4.8rem",
    textAlign: "center",
  },
}

const cssEngTitle = {
  fontSize: "2.4rem",
  textAlign: "left",
  margin: "1.5rem 0 1.2rem 0",
}

const cssPageP = {}

const cssBarChart = {
  margin: "1rem 0",
}

const cssStickyContainer = {
  position: "sticky",
  top: 0,
  zIndex: 10,
  padding: "unset",
}

const cssStickyMenu = {
  color: "var(--cl-black)",
  width: "50%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "1.5rem 0",
  cursor: "pointer",
  "span.anticon": {
    "&.rotate-180": {
      transform: "rotate(180deg)",
      transition: "0.15s ease",
    },
  },
}

const cssStickyMenuTitle = {
  fontWeight: "bold",
  fontSize: "2rem",
  marginLeft: "1rem",
}

const PartyPage = props => {
  const { party, ...data } = props.data
  const members = data.allPeopleYaml.edges
    .map(e => e.node)
    .filter(({ is_mp }) => is_mp)

  const [memberFilter, setMemberFilter] = useState({})
  const selectMemberFilter = filter => () => setMemberFilter(filter)

  const [voteLogsArrow, setVoteLogsArrow] = useState({})
  const [membersArrow, setMembersArrow] = useState({})
  const [voteLogsRotate, setVoteLogsRotate] = useState({})
  const [membersRotate, setMembersRotate] = useState({})
  const navRef = useRef(null)
  const voteLogsRef = useRef(null)
  const membersRef = useRef(null)

  useEffect(() => {
    const navHeight = navRef.current?.offsetHeight || 0
    const topOfVoteLogs = (voteLogsRef.current?.offsetTop || 0) - navHeight
    const bottomOfVoteLogs =
      topOfVoteLogs + (voteLogsRef.current?.offsetHeight || 0)
    const topOfMembers = (membersRef.current?.offsetTop || 0) - navHeight
    const bottomOfMembers =
      topOfMembers + (membersRef.current?.offsetHeight || 0)

    document.addEventListener("scroll", e => {
      const scrollTop = document.documentElement.scrollTop

      const isFocusOnVoteLogs =
        scrollTop >= topOfVoteLogs && scrollTop < bottomOfVoteLogs
      setVoteLogsArrow(!isFocusOnVoteLogs)
      setVoteLogsRotate(scrollTop >= bottomOfVoteLogs)

      const isFocusOnMembers =
        scrollTop >= topOfMembers && scrollTop < bottomOfMembers
      setMembersArrow(!isFocusOnMembers)
      setMembersRotate(scrollTop >= bottomOfMembers)
    })
  })

  const countMembers = filter => {
    // filter member by mp_type
    let selectedMembers = members.filter(
      member => !filter.mp_type || member.mp_type === filter.mp_type
    )
    return selectedMembers.length
  }
  const getSortedMembers = () => {
    // filter party member by mp_type
    let selectedMembers = members.filter(
      member => !memberFilter.mp_type || member.mp_type === memberFilter.mp_type
    )
    if (memberFilter.mp_type === "บัญชีรายชื่อ") {
      // sort by party list
      selectedMembers.sort((a, b) => a.mp_list - b.mp_list)
    } else if (memberFilter.mp_type === "แบ่งเขต") {
      // sort by province and zone
      selectedMembers.sort((a, b) =>
        a.mp_province === b.mp_province
          ? a.mp_zone - b.mp_zone
          : a.mp_province.localeCompare(b.mp_province, "th")
      )
    } else {
      // sort by name and lastname
      selectedMembers.sort((a, b) =>
        a.name === b.name
          ? a.lastname.localeCompare(b.lastname, "th")
          : a.name.localeCompare(b.name, "th")
      )
    }
    return selectedMembers
  }

  const tabList = [
    {
      id: "ทั้งหมด",
      label: "ทั้งหมด",
      count: countMembers({}),
      filter: {},
      getClass: memberFilter => (!memberFilter.mp_type ? "active" : ""),
    },
    {
      id: "บัญชีรายชื่อ",
      label: "บัญชีรายชื่อ",
      count: countMembers({ mp_type: "บัญชีรายชื่อ" }),
      filter: { mp_type: "บัญชีรายชื่อ" },
      getClass: memberFilter =>
        memberFilter.mp_type === "บัญชีรายชื่อ" ? "active" : "",
    },
    {
      id: "แบ่งเขต",
      label: "แบ่งเขต",
      count: countMembers({ mp_type: "แบ่งเขต" }),
      filter: { mp_type: "แบ่งเขต" },
      getClass: memberFilter =>
        memberFilter.mp_type === "แบ่งเขต" ? "active" : "",
    },
  ]

  const {
    mp_type,
    gender,
    age,
    education,
    occupation_group,
    asset,
  } = loadCategoryStats(data)

  const keyMembers = _.compact(
    [
      {
        name: "party_leader",
        label: "หัวหน้าพรรค",
      },
      {
        name: "party_secretary",
        label: "เลขาธิการพรรค",
      },
    ].map((keyPos, id) => {
      if (!party[keyPos.name]) return null
      const nameParts = party[keyPos.name].split(" ").slice(1)
      const slug = peopleSlug(nameParts.join(" "))
      const name = nameParts[0]
      const lastname = nameParts.slice(1).join(" ")
      const position = keyPos.label
      const images = data.allPeopleYaml.edges.find(
        ({ node }) => node.name === name && node.lastname === lastname
      )?.node?.images

      return { id, name, lastname, position, fields: { slug }, images }
    })
  )

  const showingMembers = getSortedMembers()

  const votelogs = joinPeopleVotelog(
    data.allPeopleYaml,
    data.allPeopleVoteYaml,
    data.allVotelogYaml
  )

  return (
    <Layout pageStyles={{ background: party.color }}>
      <Seo title={`พรรค${party.name}`} imageUrl="/seo/share/party.png" />
      <section className="section">
        <div className="book">
          <div className="page leftPage">
            <h1 css={{ ...cssH1, margin: "1rem 0 0 0" }}>พรรค{party.name}</h1>
            <h2 style={{ ...cssEngTitle }}>{party.en.name} Party</h2>
            <h2 style={{ ...cssEngTitle }}>About</h2>
            <p css={{ ...cssPageP }}>{party.description}</p>
            <h2 css={{ ...cssEngTitle }}>Official Link</h2>
            <OfficialWebsite {...party}></OfficialWebsite>
            <h2 css={{ ...cssEngTitle }}>In Office</h2>
            <InOfficeDate {...party}></InOfficeDate>
            <h2 style={{ ...cssEngTitle }}>Key Members</h2>
            {keyMembers.map(x => {
              return (
                <div className="peopleCard" key={x.id}>
                  <PeopleCardMini key={x.id} {...x} />
                </div>
              )
            })}
          </div>
          <div className="page">
            <h2
              style={{
                ...cssEngTitle,
                marginTop: "11.1rem",
                marginBottom: "0rem",
              }}
            >
              Members
            </h2>
            <h2
              style={{
                ...cssEngTitle,
                fontFamily: "var(--ff-text)",
                fontWeight: "normal",
              }}
            >
              สมาชิกสภาผู้แทนราษฎรจำนวน {data.allPeopleYaml.totalCount} คน
            </h2>
            <div css={{ width: "100%" }}>
              <div style={{ ...cssBarChart }}>
                <StackedBarChart data={mp_type}></StackedBarChart>
              </div>
              <div style={{ ...cssBarChart }}>
                <StackedBarChart data={gender}></StackedBarChart>
              </div>
              <div style={{ ...cssBarChart }}>
                <StackedBarChart data={age}></StackedBarChart>
              </div>
              <div style={{ ...cssBarChart }}>
                <StackedBarChart data={education}></StackedBarChart>
              </div>
              <div style={{ ...cssBarChart }}>
                <StackedBarChart data={occupation_group}></StackedBarChart>
              </div>
              <div style={{ ...cssBarChart }}>
                <StackedBarChart data={asset}></StackedBarChart>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        css={{
          ...cssSection,
          ...cssStickyContainer,
          background: "var(--cl-white)",
        }}
      >
        <div
          ref={navRef}
          css={{
            display: "flex",
            justifyContent: "space-between",
            boxShadow: "0px 0px 9px rgba(0, 0, 0, 0.7)",
          }}
        >
          <a href="#voteLogs" css={{ ...cssStickyMenu }}>
            {voteLogsArrow ? (
              <ArrowDownOutlined
                className={voteLogsRotate ? "rotate-180" : ""}
                css={{ fontSize: "2rem" }}
              />
            ) : (
              <div
                css={{
                  width: "2rem",
                  height: "2rem",
                }}
              />
            )}
            <span css={{ ...cssStickyMenuTitle }}>การลงมติล่าสุดของพรรค</span>
          </a>
          <a href="#members" css={{ ...cssStickyMenu, background: "#EEEEEE" }}>
            {membersArrow ? (
              <ArrowDownOutlined
                className={membersRotate ? "rotate-180" : ""}
                css={{ fontSize: "2rem" }}
              />
            ) : (
              <div
                css={{
                  width: "2rem",
                  height: "2rem",
                }}
              />
            )}
            <span css={{ ...cssStickyMenuTitle }}>สมาชิกพรรคในสภา</span>
          </a>
        </div>
      </section>

      {votelogs.length > 0 ? (
        <section
          id="voteLogs"
          ref={voteLogsRef}
          css={{ ...cssSection, background: "var(--cl-white)" }}
        >
          <div className="container">
            <h2 css={{ ...cssH1, paddingTop: "6rem" }}>
              การลงมติล่าสุดของพรรค
            </h2>
            <CardGrid>
              {votelogs.map(({ yamlId, fields, ...voteLog }) => (
                <VoteLogCard
                  isCompact
                  key={yamlId}
                  slug={fields.slug}
                  {...voteLog}
                />
              ))}
            </CardGrid>
          </div>
        </section>
      ) : null}

      <section
        id="members"
        ref={membersRef}
        css={{ ...cssSection, background: "#eeeeee" }}
      >
        <div className="container">
          <h2
            css={{
              fontSize: "4.8rem",
              textAlign: "center",
              paddingTop: "6rem",
            }}
          >
            สมาชิกพรรคในสภา
          </h2>
          <div
            css={{
              display: "block",
              listStyle: "none",
              textAlign: "center",
              marginBottom: "2.4rem",
              "> button": {
                display: "inline-block",
                fontSize: "2.4rem",
                padding: "1rem 0 0",
                margin: "0 1rem",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                lineHeight: 1.5,
                "&.active": {
                  borderBottom: "8px solid var(--cl-black)",
                },
              },
            }}
            role="tablist"
          >
            {tabList.map(tab => (
              <button
                type="button"
                key={tab.id}
                className={[tab.getClass(memberFilter)].join(" ")}
                role="tab"
                onClick={selectMemberFilter(tab.filter)}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          {showingMembers.length > 0 ? (
            <CardGrid>
              {showingMembers.map(member => (
                <PeopleCard key={member.id} {...member} type="mp" />
              ))}
            </CardGrid>
          ) : (
            <div
              css={{
                fontFamily: "var(--ff-title)",
                fontSize: "3.2rem",
                textAlign: "center",
                margin: "6rem 0",
              }}
            >
              ไม่มีสมาชิก
            </div>
          )}
        </div>
      </section>
    </Layout>
  )
}

export default PartyPage
